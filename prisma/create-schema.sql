-- Create the 'snakey' schema in Supabase
-- Run this in: Supabase Dashboard > SQL Editor > New Query

-- Create the schema
CREATE SCHEMA IF NOT EXISTS snakey;

-- Grant usage to authenticated users (for RLS)
GRANT USAGE ON SCHEMA snakey TO postgres, anon, authenticated, service_role;

-- Grant all privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA snakey
GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA snakey
GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Verify schema was created
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'snakey';
