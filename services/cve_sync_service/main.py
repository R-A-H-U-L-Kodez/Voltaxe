"""
Voltaxe Clarity Hub - CVE Synchronization Service
Real-time vulnerability database synchronization with NIST NVD
"""

import os
import asyncio
import aiohttp
import json
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, JSON, Boolean
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
import time
import structlog

# Configure structured logging
logger = structlog.get_logger()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mysecretpassword@localhost/postgres")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class CVEDB(Base):
    """CVE Database Model for storing NIST NVD data"""
    __tablename__ = "cve_database"
    
    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    cvss_v3_score = Column(Float)
    cvss_v3_vector = Column(String)
    cvss_v2_score = Column(Float)
    cvss_v2_vector = Column(String)
    severity = Column(String, index=True)
    attack_vector = Column(String)
    published_date = Column(DateTime, index=True)
    last_modified = Column(DateTime, index=True)
    references = Column(JSON)
    cpe_configurations = Column(JSON)
    affected_products = Column(JSON)
    exploitability_score = Column(Float)
    impact_score = Column(Float)
    weaknesses = Column(JSON)
    vendor_comments = Column(JSON)
    is_active = Column(Boolean, default=True, index=True)
    sync_timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class CVESyncService:
    """Production CVE synchronization service with NIST NVD API"""
    
    def __init__(self):
        self.nvd_api_key = os.getenv("NVD_API_KEY")
        self.base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        self.sync_interval_hours = int(os.getenv("SYNC_INTERVAL_HOURS", "24"))
        self.max_records_per_request = 2000
        self.rate_limit_delay = 6 if self.nvd_api_key else 30  # Seconds between requests
        
        if not self.nvd_api_key:
            logger.warning("⚠️  NVD_API_KEY not configured. Using public rate limits (slower).")
        else:
            logger.info("✅ NVD API key configured. Using authenticated rate limits.")
    
    async def sync_cve_database(self) -> Dict[str, Any]:
        """Main synchronization method"""
        start_time = time.time()
        logger.info("🔄 Starting CVE database synchronization...")
        
        try:
            # Create database tables if they don't exist
            Base.metadata.create_all(bind=engine)
            
            # Get the last sync timestamp
            last_sync = await self._get_last_sync_timestamp()
            
            # Calculate sync parameters
            if last_sync:
                # Incremental sync - get CVEs modified since last sync
                start_date = last_sync
                logger.info(f"📅 Performing incremental sync from {start_date}")
            else:
                # Full sync - get CVEs from the last 30 days initially
                start_date = datetime.datetime.utcnow() - datetime.timedelta(days=30)
                logger.info(f"📅 Performing initial sync from {start_date}")
            
            # Sync CVE data
            sync_stats = await self._sync_cve_data(start_date)
            
            # Calculate performance metrics
            duration = time.time() - start_time
            logger.info(f"✅ CVE sync completed in {duration:.2f}s", **sync_stats)
            
            return {
                "status": "success",
                "duration_seconds": duration,
                **sync_stats
            }
            
        except Exception as e:
            logger.error(f"❌ CVE sync failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "duration_seconds": time.time() - start_time
            }
    
    async def _get_last_sync_timestamp(self) -> Optional[datetime.datetime]:
        """Get the timestamp of the last successful sync"""
        with SessionLocal() as db:
            latest_cve = db.query(CVEDB).order_by(CVEDB.sync_timestamp.desc()).first()
            if latest_cve:
                # Access the attribute value directly (SQLAlchemy handles the conversion)
                return getattr(latest_cve, 'sync_timestamp', None)
            return None
    
    async def _sync_cve_data(self, start_date: datetime.datetime) -> Dict[str, Any]:
        """Sync CVE data from NIST NVD API"""
        
        total_processed = 0
        total_updated = 0
        total_new = 0
        total_errors = 0
        
        async with aiohttp.ClientSession() as session:
            
            # Prepare request parameters
            params = {
                "resultsPerPage": self.max_records_per_request,
                "startIndex": 0,
                "lastModStartDate": start_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "lastModEndDate": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            }
            
            if self.nvd_api_key:
                headers = {"apiKey": self.nvd_api_key}
            else:
                headers = {}
            
            while True:
                try:
                    logger.info(f"📥 Fetching CVEs (offset: {params['startIndex']})...")
                    
                    # Make API request with rate limiting
                    async with session.get(
                        self.base_url,
                        params=params,
                        headers=headers
                    ) as response:
                        
                        if response.status == 200:
                            data = await response.json()
                            vulnerabilities = data.get("vulnerabilities", [])
                            
                            if not vulnerabilities:
                                logger.info("📭 No more CVEs to process")
                                break
                            
                            # Process this batch of CVEs
                            batch_stats = await self._process_cve_batch(vulnerabilities)
                            total_processed += batch_stats["processed"]
                            total_updated += batch_stats["updated"]
                            total_new += batch_stats["new"]
                            total_errors += batch_stats["errors"]
                            
                            # Check if we've reached the end
                            total_results = data.get("totalResults", 0)
                            if params["startIndex"] + len(vulnerabilities) >= total_results:
                                break
                            
                            # Update offset for next batch
                            params["startIndex"] += len(vulnerabilities)
                            
                        elif response.status == 429:
                            # Rate limit exceeded
                            logger.warning("⏳ Rate limit exceeded. Waiting...")
                            await asyncio.sleep(60)
                            continue
                            
                        else:
                            logger.error(f"❌ API request failed: {response.status}")
                            total_errors += 1
                            break
                    
                    # Rate limiting delay
                    await asyncio.sleep(self.rate_limit_delay)
                    
                except Exception as e:
                    logger.error(f"❌ Error processing CVE batch: {e}")
                    total_errors += 1
                    await asyncio.sleep(30)  # Wait before retrying
        
        return {
            "total_processed": total_processed,
            "new_cves": total_new,
            "updated_cves": total_updated,
            "errors": total_errors
        }
    
    async def _process_cve_batch(self, vulnerabilities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process a batch of CVE records"""
        
        processed = 0
        updated = 0
        new = 0
        errors = 0
        
        with SessionLocal() as db:
            for vuln_data in vulnerabilities:
                try:
                    cve = vuln_data.get("cve", {})
                    cve_id = cve.get("id")
                    
                    if not cve_id:
                        continue
                    
                    # Parse CVE data
                    cve_record = self._parse_cve_data(cve)
                    
                    # Check if CVE already exists
                    existing_cve = db.query(CVEDB).filter(CVEDB.cve_id == cve_id).first()
                    
                    if existing_cve:
                        # Update existing record
                        for key, value in cve_record.items():
                            setattr(existing_cve, key, value)
                        setattr(existing_cve, 'sync_timestamp', datetime.datetime.utcnow())
                        updated += 1
                    else:
                        # Create new record
                        new_cve = CVEDB(**cve_record)
                        db.add(new_cve)
                        new += 1
                    
                    processed += 1
                    
                    # Commit in batches for performance
                    if processed % 100 == 0:
                        db.commit()
                        logger.info(f"💾 Committed {processed} CVE records...")
                
                except Exception as e:
                    logger.error(f"❌ Error processing CVE {cve_id}: {e}")
                    errors += 1
            
            # Final commit
            db.commit()
        
        return {
            "processed": processed,
            "updated": updated,
            "new": new,
            "errors": errors
        }
    
    def _parse_cve_data(self, cve: Dict[str, Any]) -> Dict[str, Any]:
        """Parse CVE data from NIST NVD format"""
        
        cve_id = cve.get("id")
        
        # Description
        descriptions = cve.get("descriptions", [])
        description = next((d["value"] for d in descriptions if d.get("lang") == "en"), "")
        
        # CVSS scores
        metrics = cve.get("metrics", {})
        cvss_v3 = metrics.get("cvssMetricV31", []) or metrics.get("cvssMetricV30", [])
        cvss_v2 = metrics.get("cvssMetricV2", [])
        
        cvss_v3_score = None
        cvss_v3_vector = None
        severity = "UNKNOWN"
        attack_vector = None
        
        if cvss_v3:
            cvss_v3_data = cvss_v3[0].get("cvssData", {})
            cvss_v3_score = cvss_v3_data.get("baseScore")
            cvss_v3_vector = cvss_v3_data.get("vectorString")
            severity = cvss_v3_data.get("baseSeverity", "UNKNOWN")
            attack_vector = cvss_v3_data.get("attackVector")
        
        cvss_v2_score = None
        cvss_v2_vector = None
        
        if cvss_v2:
            cvss_v2_data = cvss_v2[0].get("cvssData", {})
            cvss_v2_score = cvss_v2_data.get("baseScore")
            cvss_v2_vector = cvss_v2_data.get("vectorString")
        
        # Dates
        published_date = datetime.datetime.fromisoformat(
            cve.get("published", "").replace("Z", "+00:00")
        ) if cve.get("published") else None
        
        last_modified = datetime.datetime.fromisoformat(
            cve.get("lastModified", "").replace("Z", "+00:00")
        ) if cve.get("lastModified") else None
        
        # References
        references = [
            {
                "url": ref.get("url"),
                "source": ref.get("source"),
                "tags": ref.get("tags", [])
            }
            for ref in cve.get("references", [])
        ]
        
        # Weaknesses
        weaknesses = [
            {
                "source": weakness.get("source"),
                "type": weakness.get("type"),
                "description": weakness.get("description", [])
            }
            for weakness in cve.get("weaknesses", [])
        ]
        
        # Configurations (affected products)
        configurations = cve.get("configurations", [])
        
        return {
            "cve_id": cve_id,
            "description": description,
            "cvss_v3_score": cvss_v3_score,
            "cvss_v3_vector": cvss_v3_vector,
            "cvss_v2_score": cvss_v2_score,
            "cvss_v2_vector": cvss_v2_vector,
            "severity": severity,
            "attack_vector": attack_vector,
            "published_date": published_date,
            "last_modified": last_modified,
            "references": references,
            "cpe_configurations": configurations,
            "weaknesses": weaknesses,
            "is_active": True,
            "sync_timestamp": datetime.datetime.utcnow()
        }

async def main():
    """Main entry point for the CVE sync service"""
    
    logger.info("🚀 Starting Voltaxe CVE Synchronization Service")
    
    sync_service = CVESyncService()
    
    while True:
        try:
            # Perform CVE synchronization
            result = await sync_service.sync_cve_database()
            
            if result["status"] == "success":
                logger.info(f"✅ CVE sync completed successfully", **result)
            else:
                logger.error(f"❌ CVE sync failed", error=result.get("error"))
            
            # Wait for next sync interval
            sleep_seconds = sync_service.sync_interval_hours * 3600
            logger.info(f"😴 Sleeping for {sync_service.sync_interval_hours} hours...")
            await asyncio.sleep(sleep_seconds)
            
        except KeyboardInterrupt:
            logger.info("👋 CVE sync service stopped by user")
            break
        except Exception as e:
            logger.error(f"💥 Unexpected error in CVE sync service: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes before retrying

if __name__ == "__main__":
    asyncio.run(main())