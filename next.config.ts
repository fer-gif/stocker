import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'pg'],
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
