"""
Voltaxe Axon Engine - Resilience Scoring Intelligence Service
Advanced cybersecurity risk assessment and endpoint resilience scoring
"""

import os
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Float, desc, Boolean, Text, update
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import structlog
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure structured logging
logger = structlog.get_logger()

# --- Database Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voltaxe_clarity.db")
SCORING_INTERVAL = int(os.getenv("AXON_SCORING_INTERVAL", "60"))  # seconds
ACTIVE_THRESHOLD_HOURS = int(os.getenv("ACTIVE_THRESHOLD_HOURS", "24"))  # hours

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Enhanced Database Models ---
class SnapshotDB(Base):
    """Enhanced Snapshot model with resilience scoring"""
    __tablename__ = "snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(JSON)
    resilience_score = Column(Integer, default=None, index=True)
    risk_category = Column(String, default=None, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    last_scored = Column(DateTime, default=None)

class EventDB(Base):
    """Enhanced Event model for security analysis"""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    event_type = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(JSON)

class CVEDB(Base):
    """CVE Database model for vulnerability scoring"""
    __tablename__ = "cve_database"
    
    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    cvss_v3_score = Column(Float)
    cvss_v2_score = Column(Float)
    severity = Column(String, index=True)
    attack_vector = Column(String)
    published_date = Column(DateTime, index=True)
    last_modified = Column(DateTime, index=True)
    is_active = Column(Boolean, default=True, index=True)

class ResilienceMetrics(Base):
    """Resilience scoring metrics and history"""
    __tablename__ = "resilience_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    resilience_score = Column(Integer)
    risk_category = Column(String)
    vulnerability_count = Column(Integer, default=0)
    suspicious_events_count = Column(Integer, default=0)
    critical_vulnerabilities = Column(Integer, default=0)
    high_vulnerabilities = Column(Integer, default=0)
    medium_vulnerabilities = Column(Integer, default=0)
    low_vulnerabilities = Column(Integer, default=0)
    score_details = Column(JSON)

# Create tables
Base.metadata.create_all(bind=engine)

class VoltaxeAxonEngine:
    """
    Voltaxe Axon Engine - Advanced Resilience Scoring System
    
    This service continuously analyzes endpoint security posture and calculates
    resilience scores based on multiple security factors:
    
    - Vulnerability presence and severity (CVSS scores)
    - Suspicious behavioral patterns
    - System configuration security
    - Threat intelligence correlation
    - Historical security events
    """
    
    def __init__(self):
        self.db = SessionLocal()
        logger.info("🔥 Voltaxe Axon Engine initialized", 
                   database=DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL)
    
    def get_active_endpoints(self) -> List[str]:
        """Get list of endpoints that have been active within the threshold"""
        threshold_time = datetime.utcnow() - timedelta(hours=ACTIVE_THRESHOLD_HOURS)
        
        active_snapshots = self.db.query(SnapshotDB.hostname).filter(
            SnapshotDB.timestamp >= threshold_time
        ).distinct().all()
        
        hostnames = [s[0] for s in active_snapshots]
        logger.info(f"📡 Found {len(hostnames)} active endpoints", 
                   endpoints=hostnames, threshold_hours=ACTIVE_THRESHOLD_HOURS)
        
        return hostnames
    
    def analyze_vulnerabilities(self, hostname: str) -> Tuple[int, Dict[str, int]]:
        """Analyze vulnerability events and calculate severity-based scoring"""
        
        # Get vulnerability events for this hostname
        vuln_events = self.db.query(EventDB).filter(
            EventDB.hostname == hostname,
            EventDB.event_type == 'VULNERABILITY_DETECTED'
        ).all()
        
        vulnerability_analysis = {
            'critical': 0,
            'high': 0, 
            'medium': 0,
            'low': 0,
            'unknown': 0
        }
        
        total_deduction = 0
        
        for event in vuln_events:
            details = event.details or {}
            cve_id = details.get('cve', '') if isinstance(details, dict) else ''
            
            if cve_id:
                # Look up CVE in database for accurate CVSS scoring
                cve_record = self.db.query(CVEDB).filter(CVEDB.cve_id == cve_id).first()
                
                if cve_record:
                    # Extract actual values from SQLAlchemy model
                    cvss_v3_score = getattr(cve_record, 'cvss_v3_score', None)
                    cvss_v2_score = getattr(cve_record, 'cvss_v2_score', None)
                    cvss_score = cvss_v3_score or cvss_v2_score or 0.0
                    severity_val = getattr(cve_record, 'severity', None) or 'UNKNOWN'
                    
                    # Severity-based scoring (more granular than original)
                    if cvss_score >= 9.0 or 'CRITICAL' in severity_val.upper():
                        vulnerability_analysis['critical'] += 1
                        total_deduction += 40  # Critical: 40 points
                    elif cvss_score >= 7.0 or 'HIGH' in severity_val.upper():
                        vulnerability_analysis['high'] += 1
                        total_deduction += 25  # High: 25 points
                    elif cvss_score >= 4.0 or 'MEDIUM' in severity_val.upper():
                        vulnerability_analysis['medium'] += 1
                        total_deduction += 15  # Medium: 15 points
                    elif cvss_score > 0 or 'LOW' in severity_val.upper():
                        vulnerability_analysis['low'] += 1
                        total_deduction += 5   # Low: 5 points
                    else:
                        vulnerability_analysis['unknown'] += 1
                        total_deduction += 10  # Unknown: 10 points (cautious approach)
                else:
                    # CVE not in our database, use conservative scoring
                    vulnerability_analysis['unknown'] += 1
                    total_deduction += 15  # Conservative: 15 points for unknown CVEs
            else:
                # No CVE specified, generic vulnerability
                vulnerability_analysis['unknown'] += 1
                total_deduction += 10
        
        total_vulnerabilities = sum(vulnerability_analysis.values())
        
        logger.info(f"🔍 Vulnerability analysis for {hostname}",
                   total_vulns=total_vulnerabilities,
                   breakdown=vulnerability_analysis,
                   deduction=total_deduction)
        
        return total_deduction, vulnerability_analysis
    
    def analyze_suspicious_behavior(self, hostname: str) -> Tuple[int, int]:
        """Analyze suspicious behavioral patterns"""
        
        # Look at suspicious events in the last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        suspicious_events = self.db.query(EventDB).filter(
            EventDB.hostname == hostname,
            EventDB.event_type.in_([
                'SUSPICIOUS_PARENT_CHILD_PROCESS',
                'SUSPICIOUS_PARENT_CHILD',
                'SUSPICIOUS_BEHAVIOR_DETECTED',
                'ANOMALOUS_PROCESS_ACTIVITY'
            ]),
            EventDB.timestamp >= seven_days_ago
        ).count()
        
        # Behavioral scoring (escalating penalty for repeated suspicious behavior)
        if suspicious_events == 0:
            deduction = 0
        elif suspicious_events <= 2:
            deduction = suspicious_events * 5    # 1-2 events: 5 points each
        elif suspicious_events <= 5:
            deduction = 10 + (suspicious_events - 2) * 8  # 3-5 events: escalating penalty
        else:
            deduction = 34 + (suspicious_events - 5) * 10  # 6+ events: major concern
        
        logger.info(f"🕵️ Behavioral analysis for {hostname}",
                   suspicious_events=suspicious_events,
                   deduction=deduction)
        
        return deduction, suspicious_events
    
    def calculate_resilience_score(self, hostname: str) -> Dict[str, Any]:
        """
        Calculate comprehensive resilience score for an endpoint
        
        Scoring Algorithm:
        - Base Score: 100 (Perfect security baseline)
        - Vulnerability Deductions: Based on CVSS severity
        - Behavioral Deductions: Based on suspicious activities
        - Bonus Points: For good security practices (future enhancement)
        - Final Score: 0-100 scale with risk categorization
        """
        
        logger.info(f"🎯 Calculating resilience score for '{hostname}'")
        
        base_score = 100
        score_breakdown = {
            'base_score': base_score,
            'vulnerability_deduction': 0,
            'behavioral_deduction': 0,
            'final_score': 0,
            'risk_category': 'UNKNOWN'
        }
        
        # Vulnerability Analysis
        vuln_deduction, vuln_breakdown = self.analyze_vulnerabilities(hostname)
        score_breakdown['vulnerability_deduction'] = vuln_deduction
        score_breakdown['vulnerability_breakdown'] = vuln_breakdown
        
        # Behavioral Analysis  
        behavioral_deduction, suspicious_count = self.analyze_suspicious_behavior(hostname)
        score_breakdown['behavioral_deduction'] = behavioral_deduction
        score_breakdown['suspicious_events_count'] = suspicious_count
        
        # Calculate final score
        final_score = base_score - vuln_deduction - behavioral_deduction
        final_score = max(0, final_score)  # Ensure score doesn't go below 0
        
        score_breakdown['final_score'] = final_score
        
        # Risk Categorization
        if final_score >= 85:
            risk_category = 'LOW'
        elif final_score >= 70:
            risk_category = 'MEDIUM'
        elif final_score >= 50:
            risk_category = 'HIGH'
        else:
            risk_category = 'CRITICAL'
        
        score_breakdown['risk_category'] = risk_category
        
        logger.info(f"📊 Resilience score calculated for '{hostname}'",
                   final_score=final_score,
                   risk_category=risk_category,
                   vuln_deduction=vuln_deduction,
                   behavioral_deduction=behavioral_deduction)
        
        return score_breakdown
    
    def update_snapshot_score(self, hostname: str, score_data: Dict[str, Any]) -> bool:
        """Update the latest snapshot with resilience score"""
        
        try:
            # Find the latest snapshot for this hostname
            latest_snapshot = self.db.query(SnapshotDB).filter(
                SnapshotDB.hostname == hostname
            ).order_by(desc(SnapshotDB.timestamp)).first()
            
            if latest_snapshot:
                # Use update query to avoid SQLAlchemy attribute access issues
                self.db.execute(
                    update(SnapshotDB)
                    .where(SnapshotDB.id == latest_snapshot.id)
                    .values(
                        resilience_score=score_data['final_score'],
                        risk_category=score_data['risk_category'],
                        last_scored=datetime.utcnow()
                    )
                )
                
                self.db.commit()
                
                logger.info(f"✅ Updated snapshot score for '{hostname}'",
                           snapshot_id=latest_snapshot.id,
                           score=score_data['final_score'],
                           risk=score_data['risk_category'])
                
                return True
            else:
                logger.warning(f"⚠️ No snapshot found for '{hostname}' to update")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to update snapshot score for '{hostname}'", error=str(e))
            self.db.rollback()
            return False
    
    def save_resilience_metrics(self, hostname: str, score_data: Dict[str, Any]) -> bool:
        """Save detailed resilience metrics for historical analysis"""
        
        try:
            vuln_breakdown = score_data.get('vulnerability_breakdown', {})
            
            metrics = ResilienceMetrics(
                hostname=hostname,
                resilience_score=score_data['final_score'],
                risk_category=score_data['risk_category'],
                vulnerability_count=sum(vuln_breakdown.values()),
                suspicious_events_count=score_data.get('suspicious_events_count', 0),
                critical_vulnerabilities=vuln_breakdown.get('critical', 0),
                high_vulnerabilities=vuln_breakdown.get('high', 0),
                medium_vulnerabilities=vuln_breakdown.get('medium', 0),
                low_vulnerabilities=vuln_breakdown.get('low', 0),
                score_details=score_data
            )
            
            self.db.add(metrics)
            self.db.commit()
            
            logger.info(f"💾 Saved resilience metrics for '{hostname}'",
                       score=score_data['final_score'])
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save resilience metrics for '{hostname}'", error=str(e))
            self.db.rollback()
            return False
    
    def run_scoring_cycle(self):
        """Execute a complete resilience scoring cycle for all active endpoints"""
        
        logger.info("🔥 Starting Voltaxe Axon Engine scoring cycle")
        cycle_start = datetime.utcnow()
        
        try:
            # Get active endpoints
            active_endpoints = self.get_active_endpoints()
            
            if not active_endpoints:
                logger.info("📭 No active endpoints found - nothing to score")
                return
            
            scored_count = 0
            total_endpoints = len(active_endpoints)
            
            for hostname in active_endpoints:
                try:
                    # Calculate resilience score
                    score_data = self.calculate_resilience_score(hostname)
                    
                    # Update snapshot with score
                    snapshot_updated = self.update_snapshot_score(hostname, score_data)
                    
                    # Save detailed metrics
                    metrics_saved = self.save_resilience_metrics(hostname, score_data)
                    
                    if snapshot_updated and metrics_saved:
                        scored_count += 1
                        
                        # Log final result
                        logger.info(f"🎯 Endpoint scored successfully",
                                   hostname=hostname,
                                   score=score_data['final_score'],
                                   risk=score_data['risk_category'])
                    
                except Exception as e:
                    logger.error(f"❌ Failed to score endpoint '{hostname}'", error=str(e))
                    continue
            
            # Cycle summary
            cycle_duration = (datetime.utcnow() - cycle_start).total_seconds()
            
            logger.info("✅ Scoring cycle completed",
                       scored_endpoints=scored_count,
                       total_endpoints=total_endpoints,
                       duration_seconds=round(cycle_duration, 2))
            
        except Exception as e:
            logger.error("💥 Scoring cycle failed", error=str(e))
    
    def run_continuous_scoring(self):
        """Run the Axon Engine in continuous mode"""
        
        logger.info("🚀 Voltaxe Axon Engine started",
                   scoring_interval=SCORING_INTERVAL,
                   active_threshold_hours=ACTIVE_THRESHOLD_HOURS)
        
        print("=" * 60)
        print("🔥 VOLTAXE AXON ENGINE - RESILIENCE SCORING SERVICE")
        print("=" * 60)
        print(f"📊 Scoring Interval: {SCORING_INTERVAL} seconds")
        print(f"⏰ Active Threshold: {ACTIVE_THRESHOLD_HOURS} hours")  
        print(f"💾 Database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        print("🎯 Starting continuous resilience scoring...")
        print("=" * 60)
        
        try:
            while True:
                self.run_scoring_cycle()
                
                logger.info(f"😴 Sleeping for {SCORING_INTERVAL} seconds until next cycle")
                time.sleep(SCORING_INTERVAL)
                
        except KeyboardInterrupt:
            logger.info("👋 Axon Engine stopped by user")
            print("\n🛑 Voltaxe Axon Engine stopped")
            
        except Exception as e:
            logger.error("💥 Axon Engine crashed", error=str(e))
            print(f"\n💥 Fatal error: {e}")
            sys.exit(1)
            
        finally:
            self.db.close()

def main():
    """Main entry point for the Voltaxe Axon Engine"""
    
    # Initialize and run the Axon Engine
    engine = VoltaxeAxonEngine()
    engine.run_continuous_scoring()

if __name__ == "__main__":
    main()