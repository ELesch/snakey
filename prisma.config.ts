// Prisma 7 Configuration
// Handles env loading - no dotenv-cli needed
import { config } from 'dotenv'
config({ path: '.env.local' })

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use DIRECT_URL for migrations (non-pooled connection)
    url: env('DIRECT_URL'),
  },
})
