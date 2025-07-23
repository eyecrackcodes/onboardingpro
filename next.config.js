/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable tracing to avoid OneDrive permission issues
  experimental: {
    instrumentationHook: false,
  },
  // Disable telemetry and tracing
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
};

module.exports = nextConfig;
