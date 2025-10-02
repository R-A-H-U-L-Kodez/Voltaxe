-- Sample CVE data for development and testing
-- This will be populated by the CVE sync service in production

INSERT INTO cve_database (
    cve_id,
    description,
    cvss_v3_score,
    severity,
    attack_vector,
    published_date,
    last_modified,
    references,
    is_active,
    sync_timestamp
) VALUES 
(
    'CVE-2024-12345',
    'Docker Desktop for Windows allows attackers to overwrite any file through the hyperv/create Docker API by controlling the DataFolder parameter in the POST request, enabling local privilege escalation.',
    9.8,
    'CRITICAL',
    'NETWORK',
    '2024-09-15'::timestamp,
    '2024-09-20'::timestamp,
    '[
        {"url": "https://nvd.nist.gov/vuln/detail/CVE-2024-12345", "source": "nvd", "tags": ["Official"]},
        {"url": "https://www.docker.com/security-advisory", "source": "vendor", "tags": ["Vendor Advisory"]}
    ]'::jsonb,
    true,
    NOW()
),
(
    'CVE-2023-45678',
    'A vulnerability in the system configuration allows local users to access sensitive information through improper file permissions.',
    7.5,
    'HIGH',
    'LOCAL',
    '2023-11-10'::timestamp,
    '2023-11-15'::timestamp,
    '[
        {"url": "https://nvd.nist.gov/vuln/detail/CVE-2023-45678", "source": "nvd", "tags": ["Official"]}
    ]'::jsonb,
    true,
    NOW()
),
(
    'CVE-2024-0001',
    'Remote code execution vulnerability in web application framework affecting multiple versions.',
    8.1,
    'HIGH',
    'NETWORK',
    '2024-01-15'::timestamp,
    '2024-01-20'::timestamp,
    '[
        {"url": "https://nvd.nist.gov/vuln/detail/CVE-2024-0001", "source": "nvd", "tags": ["Official"]}
    ]'::jsonb,
    true,
    NOW()
) ON CONFLICT (cve_id) DO NOTHING;

-- Create the optimized indexes after tables exist
SELECT create_voltaxe_indexes();

-- Create the application user
SELECT create_voltaxe_user();

RAISE NOTICE 'Sample CVE data and database optimizations applied!';