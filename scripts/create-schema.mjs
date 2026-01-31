// Script to create the 'snakey' schema in Supabase
import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const { Client } = pg;

async function createSchema() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    // Create the schema
    await client.query('CREATE SCHEMA IF NOT EXISTS snakey;');
    console.log('Created schema: snakey');

    // Grant usage
    await client.query(`
      GRANT USAGE ON SCHEMA snakey TO postgres, anon, authenticated, service_role;
    `);
    console.log('Granted usage permissions');

    // Grant privileges on future tables
    await client.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA snakey
      GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
    `);
    console.log('Granted table privileges');

    await client.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA snakey
      GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
    `);
    console.log('Granted sequence privileges');

    // Verify
    const result = await client.query(`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'snakey';
    `);

    if (result.rows.length > 0) {
      console.log('✓ Schema "snakey" created successfully!');
    } else {
      console.error('✗ Schema creation may have failed');
    }

  } catch (error) {
    console.error('Error creating schema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createSchema();
