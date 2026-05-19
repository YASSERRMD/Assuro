/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8081'}/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
