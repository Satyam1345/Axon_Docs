// Reads runtime environment variables injected into window.__ENV
// On the client: returns window.__ENV
// On the server: parses /usr/share/nginx/html/runtime-env.js and merges with process.env fallbacks
import fs from 'fs';

const RUNTIME_ENV_PATH = '/usr/share/nginx/html/runtime-env.js';

function parseEnvScript(contents) {
  try {
    const m = contents.match(/window\.__ENV\s*=\s*(\{[\s\S]*?\});?/);
    if (!m) return {};
    let objStr = m[1];
    // Quote unquoted keys to make JSON.parse happy
    objStr = objStr.replace(/([,{]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    return JSON.parse(objStr);
  } catch (_) {
    return {};
  }
}

export function getRuntimeEnv() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-undef
    return (window.__ENV || {});
  }

  let fileEnv = {};
  try {
    const contents = fs.readFileSync(RUNTIME_ENV_PATH, 'utf8');
    fileEnv = parseEnvScript(contents);
  } catch (_) {
    fileEnv = {};
  }

  const envFallbacks = {
    ADOBE_EMBED_API_KEY: process.env.NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID || process.env.ADOBE_EMBED_API_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    TTS_PROVIDER: process.env.TTS_PROVIDER,
    AZURE_TTS_KEY: process.env.AZURE_TTS_KEY,
    AZURE_TTS_ENDPOINT: process.env.AZURE_TTS_ENDPOINT,
    AZURE_TTS_REGION: process.env.AZURE_TTS_REGION,
  };

  return { ...envFallbacks, ...fileEnv };
}

