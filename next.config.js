/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

const nextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pdfkit: false,
        fontkit: false,
        fs: false,
        path: false,
        stream: false,
        buffer: false,
      };
    }

    config.externals = config.externals || [];
    if (!Array.isArray(config.externals)) {
      config.externals = [config.externals];
    }
    config.externals.push('pdfkit', 'fontkit');

    return config;
  },
});

module.exports = nextConfig;
