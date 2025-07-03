/** @type {import('next').NextConfig} */
const nextConfig = {
  // No webpack customization needed for Pages Router API routes
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig