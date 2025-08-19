/**
 * Next.js config with security headers for Adobe SDK and local PDFs
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow Adobe viewer iframe to load our resources (self only by default)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Explicitly allow Clipboard API in top-level document
          // Note: Third-party iframes may still need an iframe `allow` attribute.
          { key: 'Permissions-Policy', value: 'clipboard-read=(self), clipboard-write=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
