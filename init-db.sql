-- Create database if it doesn't exist
SELECT 'CREATE DATABASE kennel_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kennel_management')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE kennel_management TO kennel_user;
