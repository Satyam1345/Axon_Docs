# Stage 1: Build the Next.js frontend
FROM --platform=linux/amd64 node:20-bullseye-slim AS frontend-builder
WORKDIR /app/frontend

# Copy only package.json to avoid Windows-generated lockfile issues
COPY frontend/package.json ./

# Install all dependencies (including devDependencies) for Linux, generating a Linux lockfile
RUN npm install --no-audit --no-fund

# Ensure lightningcss native binary for linux/amd64 is present
RUN npm install --no-audit --no-fund lightningcss@latest lightningcss-linux-x64-gnu@latest || true

# Copy the rest of the frontend source code
COPY frontend/ ./

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application.
RUN npm run build

# Prune devDependencies to reduce the size of the final node_modules
RUN npm prune --production

# Stage 2: Prepare Python wheels for faster installation
FROM python:3.11-slim AS py-wheels-builder
ARG INSTALL_PY=1
WORKDIR /wheels
COPY round_1b/requirements.txt ./
# Always have a wheels directory to COPY from later
RUN mkdir -p /wheels
# Conditionally build wheels to avoid network failures during builds
RUN if [ "$INSTALL_PY" = "1" ]; then \
			apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/* && \
			pip wheel --no-cache-dir -r requirements.txt -w /wheels ; \
		else \
			echo "Skipping Python wheels build (INSTALL_PY=$INSTALL_PY)" ; \
		fi

# Stage 3: Final runtime image
FROM node:20-bullseye-slim
ARG INSTALL_PY=1
WORKDIR /app

# Install runtime dependencies: Python and Nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
		python3 python3-pip nginx libgomp1 \
	&& rm -rf /var/lib/apt/lists/*

# Copy application code from the host context
COPY backend ./backend
COPY round_1b ./round_1b
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built frontend artifacts from the 'frontend-builder' stage
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
# Copy files required for `next start`
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json
COPY --from=frontend-builder /app/frontend/next.config.mjs ./frontend/next.config.mjs

# Install Python dependencies from the pre-built wheels (optional)
COPY --from=py-wheels-builder /wheels /tmp/wheels
RUN if [ "$INSTALL_PY" = "1" ]; then \
			python3 -m pip install --no-cache-dir --no-index --find-links=/tmp/wheels -r round_1b/requirements.txt || \
			python3 -m pip install --no-cache-dir -r round_1b/requirements.txt ; \
			rm -rf /tmp/wheels ; \
		else \
			echo "Skipping Python dependency install (INSTALL_PY=$INSTALL_PY)" ; \
		fi
RUN if [ "$INSTALL_PY" = "1" ]; then \
			python3 -c "import numpy, torch, fitz; print('Python deps OK')" ; \
		else \
			true ; \
		fi

# Install backend Node.js dependencies
WORKDIR /app/backend
RUN npm ci --only=production --no-audit --no-fund

# Prepare the runtime-env.js file for Nginx to serve
WORKDIR /usr/share/nginx/html
RUN echo "window.__ENV = {};" > runtime-env.js

# Set working directory back to the application root
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 8080

# Use JSON array form for CMD to handle signals properly
CMD ["sh", "-c", "\
# Generate the runtime environment script for the browser \n\
echo \"window.__ENV = { ADOBE_EMBED_API_KEY: \\\"$ADOBE_EMBED_API_KEY\\\", LLM_PROVIDER: \\\"$LLM_PROVIDER\\\", GOOGLE_APPLICATION_CREDENTIALS: \\\"$GOOGLE_APPLICATION_CREDENTIALS\\\", GEMINI_API_KEY: \\\"$GEMINI_API_KEY\\\", GOOGLE_API_KEY: \\\"$GOOGLE_API_KEY\\\", GEMINI_MODEL: \\\"$GEMINI_MODEL\\\", TTS_PROVIDER: \\\"$TTS_PROVIDER\\\", AZURE_TTS_KEY: \\\"$AZURE_TTS_KEY\\\", AZURE_TTS_ENDPOINT: \\\"$AZURE_TTS_ENDPOINT\\\", AZURE_TTS_REGION: \\\"$AZURE_TTS_REGION\\\" };\" > /usr/share/nginx/html/runtime-env.js && \
# Start the Next.js server in the background on port 3000 \n\
(cd /app/frontend && export PORT=3000 && node_modules/.bin/next start) & \
# Start the backend Express server in the background on port 5001 \n\
(cd /app/backend && node server.js) & \
# Start Nginx in the foreground to keep the container running \n\
nginx -g 'daemon off;' \
"]
