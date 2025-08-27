-- Initialize test database for Schoolcierge
-- This script runs automatically when Docker Compose starts

-- Create test database if it doesn't exist
CREATE DATABASE schoolcierge_test
    WITH 
    OWNER = schoolcierge_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE schoolcierge_test TO schoolcierge_user;

-- Connect to test database
\c schoolcierge_test;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For performance

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO schoolcierge_user;
GRANT CREATE ON SCHEMA public TO schoolcierge_user;

-- Create performance optimization settings
ALTER DATABASE schoolcierge_test SET random_page_cost = 1.1;
ALTER DATABASE schoolcierge_test SET effective_cache_size = '256MB';
ALTER DATABASE schoolcierge_test SET shared_buffers = '128MB';

-- Create a cleanup function for test isolation
CREATE OR REPLACE FUNCTION truncate_all_tables()
RETURNS void AS $$
DECLARE
    statements CURSOR FOR
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma%'
        AND tablename NOT LIKE 'pg_%';
BEGIN
    FOR stmt IN statements LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the cleanup function
GRANT EXECUTE ON FUNCTION truncate_all_tables() TO schoolcierge_user;

-- Add comment
COMMENT ON DATABASE schoolcierge_test IS 'Test database for Schoolcierge - automatically cleaned between test runs';