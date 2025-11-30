"""
Shared database configuration
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database setup - PRODUCTION: PostgreSQL only (no SQLite fallback)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ CRITICAL ERROR: DATABASE_URL environment variable is not set!")
    print("   Set it to: postgresql://voltaxe_admin:password@postgres:5432/voltaxe_clarity_hub")
    print("   SQLite is NOT supported in production due to concurrency issues.")
    sys.exit(1)

# Validate that it's PostgreSQL
if not DATABASE_URL.startswith("postgresql://"):
    print("❌ CRITICAL ERROR: Only PostgreSQL is supported for DATABASE_URL!")
    print("   Current value:", DATABASE_URL)
    print("   SQLite causes 'database is locked' errors in multi-container environments.")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
