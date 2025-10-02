-- Voltaxe Clarity Hub - Database Initialization
-- Production-ready PostgreSQL schema with optimizations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create optimized indexes for better performance
-- (These will be created after tables are created by SQLAlchemy)

-- Function to create optimized indexes
CREATE OR REPLACE FUNCTION create_voltaxe_indexes() RETURNS void AS $$
BEGIN
    -- Snapshots table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_snapshots_hostname_timestamp') THEN
        CREATE INDEX idx_snapshots_hostname_timestamp ON snapshots (hostname, timestamp DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_snapshots_timestamp') THEN
        CREATE INDEX idx_snapshots_timestamp ON snapshots (timestamp DESC);
    END IF;

    -- Events table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_hostname_timestamp') THEN
        CREATE INDEX idx_events_hostname_timestamp ON events (hostname, timestamp DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_type_timestamp') THEN
        CREATE INDEX idx_events_type_timestamp ON events (event_type, timestamp DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_details_cve') THEN
        CREATE INDEX idx_events_details_cve ON events USING GIN ((details->>'cve'));
    END IF;

    -- CVE database indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cve_severity_score') THEN
        CREATE INDEX idx_cve_severity_score ON cve_database (severity, cvss_v3_score DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cve_published_date') THEN
        CREATE INDEX idx_cve_published_date ON cve_database (published_date DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cve_active_sync') THEN
        CREATE INDEX idx_cve_active_sync ON cve_database (is_active, sync_timestamp DESC);
    END IF;
    
    -- Full-text search index for CVE descriptions
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cve_description_fulltext') THEN
        CREATE INDEX idx_cve_description_fulltext ON cve_database USING GIN (to_tsvector('english', description));
    END IF;

    RAISE NOTICE 'Voltaxe database indexes created successfully!';
END;
$$ LANGUAGE plpgsql;

-- Function to create database user with limited privileges
CREATE OR REPLACE FUNCTION create_voltaxe_user() RETURNS void AS $$
BEGIN
    -- Create application user if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'voltaxe_app') THEN
        CREATE USER voltaxe_app WITH PASSWORD 'VoltaxeAppUser2025!';
        
        -- Grant necessary permissions
        GRANT CONNECT ON DATABASE voltaxe_clarity_hub TO voltaxe_app;
        GRANT USAGE ON SCHEMA public TO voltaxe_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO voltaxe_app;
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO voltaxe_app;
        
        -- Grant permissions on future tables
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO voltaxe_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO voltaxe_app;
        
        RAISE NOTICE 'Voltaxe application user created successfully!';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger function for security logging
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        changed_by,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        current_user,
        NOW()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON audit_log (table_name, operation);

RAISE NOTICE 'Voltaxe Clarity Hub database initialization completed!';