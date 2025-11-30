"""
Voltaxe Axon Engine - ML-Enhanced Production Version
Combines Resilience Scoring with Deep Learning Anomaly & Behavior Detection
"""

import joblib
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Float, Text, Boolean
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import time
from datetime import datetime, timedelta
import numpy as np
import torch
import torch.nn as nn
import os
import structlog
from dotenv import load_dotenv
from typing import Dict, List, Optional, Tuple, Any

# Load environment variables
load_dotenv()

# Configure structured logging
logger = structlog.get_logger()

# --- Database Setup - PostgreSQL Only ---
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ CRITICAL: DATABASE_URL environment variable not set!")
    logger.error("   PostgreSQL is required for ML-enhanced Axon Engine")
    logger.error("   SQLite is not supported in production due to concurrency issues")
    import sys
    sys.exit(1)

if not DATABASE_URL.startswith("postgresql://"):
    logger.error("❌ CRITICAL: Only PostgreSQL is supported!")
    logger.error(f"   Current database: {DATABASE_URL.split('://')[0]}")
    logger.error("   SQLite causes 'database is locked' errors with multiple containers")
    import sys
    sys.exit(1)

logger.info("database_config", url=DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---
class EventDB(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    hostname = Column(String, index=True)
    event_type = Column(String, index=True)
    timestamp = Column(DateTime)
    details = Column(JSON)

class SnapshotDB(Base):
    __tablename__ = "snapshots"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(JSON)
    resilience_score = Column(Integer, default=None, index=True)
    risk_category = Column(String, default=None, index=True)
    last_scored = Column(DateTime, default=None)

class CVEDB(Base):
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

class MLDetectionEvent(Base):
    """New table for ML detection results"""
    __tablename__ = "ml_detections"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    detection_type = Column(String, index=True)  # ANOMALY, MALICIOUS_BEHAVIOR
    process_name = Column(String)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(JSON)
    action_taken = Column(String)  # ALERT, BLOCK, LOG

# Create tables
Base.metadata.create_all(bind=engine)

# --- 🧠 DEEP LEARNING MODEL ARCHITECTURE 🧠 ---
class DeepClassifier(nn.Module):
    """Neural Network for Malicious Behavior Detection"""
    def __init__(self, input_dim):
        super(DeepClassifier, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.network(x)

# --- Resilience Scoring Engine ---
class ResilienceScoringEngine:
    """Calculate endpoint resilience scores based on vulnerabilities and events"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def calculate_resilience_score(self, hostname: str) -> Tuple[int, str, Dict[str, Any]]:
        """
        Calculate resilience score (0-100) and risk category
        Returns: (score, risk_category, details)
        """
        base_score = 100
        details = {
            "vulnerability_penalties": 0,
            "event_penalties": 0,
            "ml_detection_penalties": 0,
            "breakdown": {}
        }
        
        # 1. Vulnerability Analysis
        snapshot = self.db.query(SnapshotDB).filter(
            SnapshotDB.hostname == hostname
        ).order_by(SnapshotDB.timestamp.desc()).first()
        
        vuln_penalty = 0
        vuln_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        
        if snapshot and snapshot.details:
            software_list = snapshot.details.get("software", [])
            for sw in software_list:
                sw_name = sw.get("name", "").lower()
                sw_version = sw.get("version", "")
                
                # Query CVE database
                cves = self.db.query(CVEDB).filter(
                    CVEDB.description.ilike(f"%{sw_name}%"),
                    CVEDB.is_active == True
                ).all()
                
                for cve in cves:
                    severity = cve.severity or "UNKNOWN"
                    if severity in vuln_counts:
                        vuln_counts[severity] += 1
                    
                    # Penalty based on severity
                    if severity == "CRITICAL":
                        vuln_penalty += 20
                    elif severity == "HIGH":
                        vuln_penalty += 10
                    elif severity == "MEDIUM":
                        vuln_penalty += 5
                    elif severity == "LOW":
                        vuln_penalty += 2
        
        details["vulnerability_penalties"] = min(vuln_penalty, 60)
        details["breakdown"]["vulnerabilities"] = vuln_counts
        
        # 2. Suspicious Events Analysis
        recent_time = datetime.utcnow() - timedelta(hours=24)
        suspicious_events = self.db.query(EventDB).filter(
            EventDB.hostname == hostname,
            EventDB.timestamp > recent_time,
            EventDB.event_type.in_([
                'SUSPICIOUS_NETWORK_CONNECTION',
                'MALICIOUS_FILE_DETECTED',
                'UNAUTHORIZED_ACCESS_ATTEMPT'
            ])
        ).count()
        
        event_penalty = min(suspicious_events * 5, 30)
        details["event_penalties"] = event_penalty
        details["breakdown"]["suspicious_events"] = suspicious_events
        
        # 3. ML Detection Penalties
        ml_detections = self.db.query(MLDetectionEvent).filter(
            MLDetectionEvent.hostname == hostname,
            MLDetectionEvent.timestamp > recent_time
        ).count()
        
        ml_penalty = min(ml_detections * 10, 40)
        details["ml_detection_penalties"] = ml_penalty
        details["breakdown"]["ml_detections"] = ml_detections
        
        # Calculate final score
        final_score = max(0, base_score - vuln_penalty - event_penalty - ml_penalty)
        
        # Determine risk category
        if final_score >= 80:
            risk_category = "LOW"
        elif final_score >= 60:
            risk_category = "MEDIUM"
        elif final_score >= 40:
            risk_category = "HIGH"
        else:
            risk_category = "CRITICAL"
        
        return final_score, risk_category, details

# --- Main ML-Enhanced Axon Engine ---
class MLEnhancedAxonEngine:
    """Production Axon Engine with Deep Learning Integration"""
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.anomaly_model = None
        self.behavior_model = None
        self.process_frequencies = None
        self.behavior_scaler = None
        self.input_dim = 12
        
        logger.info("ml_enhanced_axon_initializing", device=str(self.device))
        
    def load_models(self):
        """Load all ML models and scalers"""
        try:
            # Layer 1: Anomaly Detection
            if os.path.exists('anomaly_model.joblib'):
                self.anomaly_model = joblib.load('anomaly_model.joblib')
                self.process_frequencies = joblib.load('process_frequencies.joblib')
                logger.info("layer1_loaded", model="anomaly_detection")
            else:
                logger.warning("layer1_missing", files=["anomaly_model.joblib"])
            
            # Layer 2: Deep Behavior Detection
            if os.path.exists('deep_classifier.pth'):
                self.behavior_model = DeepClassifier(self.input_dim).to(self.device)
                self.behavior_model.load_state_dict(
                    torch.load('deep_classifier.pth', map_location=self.device)
                )
                self.behavior_model.eval()
                self.behavior_scaler = joblib.load('deep_scaler.joblib')
                logger.info("layer2_loaded", model="deep_neural_network")
            else:
                logger.warning("layer2_missing", files=["deep_classifier.pth"])
                
        except Exception as e:
            logger.error("model_loading_error", error=str(e))
            raise
    
    def check_anomaly(self, process_name: str, hostname: str, db: Session) -> Optional[Dict]:
        """Layer 1: Check if process is anomalous"""
        if not self.anomaly_model or not self.process_frequencies:
            return None
        
        freq = self.process_frequencies.get(process_name, 0)
        is_anomaly = self.anomaly_model.predict(pd.DataFrame({'frequency': [freq]}))[0] == -1
        
        if is_anomaly:
            detection = {
                "type": "ANOMALY",
                "process": process_name,
                "hostname": hostname,
                "frequency": freq,
                "confidence": 0.85
            }
            
            # Save to database
            ml_event = MLDetectionEvent(
                hostname=hostname,
                detection_type="ANOMALY",
                process_name=process_name,
                confidence=0.85,
                details=detection,
                action_taken="ALERT"
            )
            db.add(ml_event)
            db.commit()
            
            logger.warning("anomaly_detected", **detection)
            return detection
        
        return None
    
    def check_malicious_behavior(self, traffic_features: np.ndarray, 
                                  process_name: str, hostname: str, db: Session) -> Optional[Dict]:
        """Layer 2: Check for malicious network behavior patterns"""
        if not self.behavior_model or not self.behavior_scaler:
            return None
        
        try:
            # Scale features
            features_scaled = self.behavior_scaler.transform(traffic_features)
            
            # Convert to tensor
            features_tensor = torch.FloatTensor(features_scaled).to(self.device)
            
            # Predict
            with torch.no_grad():
                probability = self.behavior_model(features_tensor).item()
            
            if probability > 0.95:  # High confidence threshold
                detection = {
                    "type": "MALICIOUS_BEHAVIOR",
                    "process": process_name,
                    "hostname": hostname,
                    "confidence": probability,
                    "recommended_action": "BLOCK"
                }
                
                # Save to database
                ml_event = MLDetectionEvent(
                    hostname=hostname,
                    detection_type="MALICIOUS_BEHAVIOR",
                    process_name=process_name,
                    confidence=probability,
                    details=detection,
                    action_taken="BLOCK"
                )
                db.add(ml_event)
                db.commit()
                
                logger.critical("malicious_behavior_detected", **detection)
                return detection
            
        except Exception as e:
            logger.error("behavior_check_error", error=str(e))
        
        return None
    
    def score_all_endpoints(self, db: Session):
        """Calculate resilience scores for all active endpoints"""
        scoring_engine = ResilienceScoringEngine(db)
        
        # Get unique hostnames from recent snapshots
        recent_time = datetime.utcnow() - timedelta(hours=24)
        hostnames = db.query(SnapshotDB.hostname).filter(
            SnapshotDB.timestamp > recent_time
        ).distinct().all()
        
        for (hostname,) in hostnames:
            try:
                score, risk_category, details = scoring_engine.calculate_resilience_score(hostname)
                
                # Update snapshot
                snapshot = db.query(SnapshotDB).filter(
                    SnapshotDB.hostname == hostname
                ).order_by(SnapshotDB.timestamp.desc()).first()
                
                if snapshot:
                    snapshot.resilience_score = score
                    snapshot.risk_category = risk_category
                    snapshot.last_scored = datetime.utcnow()
                
                # Save metrics history
                metrics = ResilienceMetrics(
                    hostname=hostname,
                    resilience_score=score,
                    risk_category=risk_category,
                    vulnerability_count=sum(details["breakdown"]["vulnerabilities"].values()),
                    critical_vulnerabilities=details["breakdown"]["vulnerabilities"]["CRITICAL"],
                    high_vulnerabilities=details["breakdown"]["vulnerabilities"]["HIGH"],
                    medium_vulnerabilities=details["breakdown"]["vulnerabilities"]["MEDIUM"],
                    low_vulnerabilities=details["breakdown"]["vulnerabilities"]["LOW"],
                    suspicious_events_count=details["breakdown"]["suspicious_events"],
                    score_details=details
                )
                db.add(metrics)
                db.commit()
                
                logger.info("resilience_scored", hostname=hostname, score=score, risk=risk_category)
                
            except Exception as e:
                logger.error("scoring_error", hostname=hostname, error=str(e))
                db.rollback()
    
    def run(self):
        """Main engine loop"""
        logger.info("axon_engine_starting", version="ML_ENHANCED_PRODUCTION")
        
        # Load ML models
        self.load_models()
        
        last_checked = datetime.utcnow()
        last_scored = datetime.utcnow()
        
        logger.info("axon_engine_active", status="SCANNING")
        
        while True:
            try:
                db = SessionLocal()
                
                # 1. Process ML Analysis (every 5 seconds)
                new_events = db.query(EventDB).filter(
                    EventDB.event_type == 'NEW_PROCESS_DETECTED',
                    EventDB.timestamp > last_checked
                ).all()
                
                if new_events:
                    logger.info("analyzing_events", count=len(new_events))
                    
                    for event in new_events:
                        proc_name = event.details.get('process', {}).get('name')
                        if not proc_name:
                            continue
                        
                        # Check for anomaly
                        self.check_anomaly(proc_name, event.hostname, db)
                        
                        # Check for malicious behavior (with simulated traffic)
                        # In production, you'd get real network metrics from Voltaxe Sentinel
                        simulated_traffic = np.array([[
                            22, 6, 500000, 2000, 5, 5000, 100, 500, 50, 10, 5, 20
                        ]])
                        self.check_malicious_behavior(simulated_traffic, proc_name, event.hostname, db)
                    
                    if new_events:
                        last_checked = new_events[-1].timestamp
                
                # 2. Resilience Scoring (every 60 seconds)
                if (datetime.utcnow() - last_scored).total_seconds() >= 60:
                    logger.info("running_resilience_scoring")
                    self.score_all_endpoints(db)
                    last_scored = datetime.utcnow()
                
                db.close()
                time.sleep(5)
                
            except KeyboardInterrupt:
                logger.info("axon_engine_shutting_down")
                break
            except Exception as e:
                logger.error("engine_loop_error", error=str(e))
                time.sleep(5)

# --- Main Entry Point ---
if __name__ == "__main__":
    engine = MLEnhancedAxonEngine()
    engine.run()
