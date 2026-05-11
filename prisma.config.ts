import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'

// Load .env in local development
import { config } from 'dotenv'
config()

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
})
