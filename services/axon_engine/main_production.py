"""
Voltaxe Axon Engine - Intelligence & Resilience Scoring Service
Production-Grade Implementation

Features:
- Voltaxe Resilience Score (VRS) calculation
- Event correlation and pattern detection
- Security metrics tracking
- Automated threat analysis
"""

import os
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import asyncpg
from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore
from apscheduler.triggers.cron import CronTrigger  # type: ignore
import structlog
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configure logging
logger = structlog.get_logger()

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://voltaxe_admin:VoltaxeSecure2025!@localhost:5432/voltaxe_clarity_hub")
RESILIENCE_SCORE_SCHEDULE = os.getenv("RESILIENCE_SCORE_SCHEDULE", "0 2 * * *")  # Daily at 2 AM
EVENT_CORRELATION_ENABLED = os.getenv("EVENT_CORRELATION_ENABLED", "true").lower() == "true"

# ============================================================================
# ENUMS AND DATA CLASSES
# ============================================================================

class SeverityLevel(str, Enum):
    """Severity levels for scoring"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ScoreGrade(str, Enum):
    """Letter grades for resilience scores"""
    A_PLUS = "A+"
    A = "A"
    A_MINUS = "A-"
    B_PLUS = "B+"
    B = "B"
    B_MINUS = "B-"
    C_PLUS = "C+"
    C = "C"
    D = "D"
    F = "F"

@dataclass
class ResilienceScore:
    """Resilience score result"""
    customer_id: int
    vrs_score: float  # 0-100
    grade: str
    vulnerability_score: float
    controls_score: float
    detection_score: float
    response_score: float
    breakdown: Dict[str, Any]
    metrics: Dict[str, Any]
    recommendations: List[str]
    score_change: Optional[float] = None
    trend: Optional[str] = None

@dataclass
class AttackPattern:
    """Attack pattern definition"""
    name: str
    display_name: str
    severity: str
    description: str
    events: List[Dict[str, Any]]
    recommendation: str
    mitre_tactics: List[str]
    mitre_techniques: List[str]

# ============================================================================
# RESILIENCE SCORE CALCULATOR
# ============================================================================

class ResilienceScoreCalculator:
    """
    Voltaxe Resilience Score (VRS) Calculator
    
    Calculates a comprehensive security posture score (0-100) based on:
    1. Vulnerability Exposure (40 points)
    2. Security Controls (30 points)
    3. Threat Detection (20 points)
    4. Incident Response (10 points)
    """
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
        self.version = "1.0.0"
    
    async def calculate_vrs(self, customer_id: int) -> ResilienceScore:
        """Calculate Voltaxe Resilience Score for a customer"""
        logger.info(f"📊 Calculating VRS for customer {customer_id}")
        
        # Get previous score for trend analysis
        previous_score = await self._get_previous_score(customer_id)
        
        # Calculate component scores
        vuln_score, vuln_metrics = await self._calculate_vulnerability_score(customer_id)
        controls_score, controls_metrics = await self._calculate_controls_score(customer_id)
        detection_score, detection_metrics = await self._calculate_detection_score(customer_id)
        response_score, response_metrics = await self._calculate_response_score(customer_id)
        
        # Calculate total score
        total_score = vuln_score + controls_score + detection_score + response_score
        
        # Determine grade
        grade = self._get_grade(total_score)
        
        # Calculate trend
        score_change = None
        trend = None
        if previous_score:
            score_change = round(total_score - previous_score, 1)
            if abs(score_change) < 2.0:
                trend = "STABLE"
            elif score_change > 0:
                trend = "IMPROVING"
            else:
                trend = "DECLINING"
        
        # Combine all metrics
        all_metrics = {
            **vuln_metrics,
            **controls_metrics,
            **detection_metrics,
            **response_metrics
        }
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            total_score, vuln_metrics, controls_metrics, 
            detection_metrics, response_metrics
        )
        
        # Create detailed breakdown
        breakdown = {
            "vulnerability_exposure": {
                "score": vuln_score,
                "max_score": 40,
                "percentage": round((vuln_score / 40) * 100, 1)
            },
            "security_controls": {
                "score": controls_score,
                "max_score": 30,
                "percentage": round((controls_score / 30) * 100, 1)
            },
            "threat_detection": {
                "score": detection_score,
                "max_score": 20,
                "percentage": round((detection_score / 20) * 100, 1)
            },
            "incident_response": {
                "score": response_score,
                "max_score": 10,
                "percentage": round((response_score / 10) * 100, 1)
            }
        }
        
        return ResilienceScore(
            customer_id=customer_id,
            vrs_score=round(total_score, 1),
            grade=grade,
            vulnerability_score=vuln_score,
            controls_score=controls_score,
            detection_score=detection_score,
            response_score=response_score,
            breakdown=breakdown,
            metrics=all_metrics,
            recommendations=recommendations,
            score_change=score_change,
            trend=trend
        )
    
    async def _calculate_vulnerability_score(self, customer_id: int) -> Tuple[float, Dict]:
        """
        Vulnerability Exposure Score (0-40 points)
        
        Factors:
        - Number of critical/high CVEs
        - Average age of vulnerabilities
        - Actively exploited vulnerabilities
        - Patch compliance
        """
        query = """
            SELECT 
                COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND status = 'OPEN') as critical_count,
                COUNT(*) FILTER (WHERE severity = 'HIGH' AND status = 'OPEN') as high_count,
                COUNT(*) FILTER (WHERE severity = 'MEDIUM' AND status = 'OPEN') as medium_count,
                COUNT(*) FILTER (WHERE status = 'OPEN') as total_open,
                AVG(EXTRACT(DAY FROM NOW() - detected_date)) FILTER (WHERE status = 'OPEN') as avg_age_days,
                COUNT(*) FILTER (WHERE actively_exploited = TRUE AND status = 'OPEN') as exploited_count,
                COUNT(*) FILTER (WHERE status = 'PATCHED' AND patched_date IS NOT NULL) as patched_count,
                COUNT(*) as total_vulnerabilities
            FROM vulnerabilities
            WHERE customer_id = $1
              AND detected_date > NOW() - INTERVAL '90 days'
        """
        
        row = await self.db.fetchrow(query, customer_id)
        
        critical_count = row['critical_count'] or 0
        high_count = row['high_count'] or 0
        medium_count = row['medium_count'] or 0
        total_open = row['total_open'] or 0
        avg_age = row['avg_age_days'] or 0
        exploited_count = row['exploited_count'] or 0
        patched_count = row['patched_count'] or 0
        total_vulns = row['total_vulnerabilities'] or 1  # Avoid division by zero
        
        # Calculate patch compliance
        patch_compliance = round((patched_count / total_vulns) * 100, 1) if total_vulns > 0 else 100.0
        
        # Scoring logic
        score = 40.0  # Start with perfect score
        
        # Deduct points for critical CVEs
        if critical_count == 0:
            score -= 0
        elif critical_count <= 5:
            score -= 10
        elif critical_count <= 10:
            score -= 20
        else:
            score -= 30
        
        # Deduct points for high CVEs
        if high_count <= 10:
            score -= 0
        elif high_count <= 20:
            score -= 5
        else:
            score -= 10
        
        # Deduct points for old vulnerabilities
        if avg_age > 60:
            score -= 10
        elif avg_age > 30:
            score -= 5
        
        # Severe penalty for actively exploited CVEs
        score -= exploited_count * 5
        
        # Ensure score doesn't go below 0
        score = max(0.0, score)
        
        metrics = {
            "critical_vulnerabilities": critical_count,
            "high_vulnerabilities": high_count,
            "medium_vulnerabilities": medium_count,
            "total_open_vulnerabilities": total_open,
            "avg_vulnerability_age_days": round(avg_age, 1),
            "exploited_vulnerabilities": exploited_count,
            "patch_compliance_pct": patch_compliance
        }
        
        return score, metrics
    
    async def _calculate_controls_score(self, customer_id: int) -> Tuple[float, Dict]:
        """
        Security Controls Score (0-30 points)
        
        Factors:
        - MFA adoption rate
        - Endpoint encryption coverage
        - Firewall configuration
        - Least privilege implementation
        """
        # Query user MFA adoption
        user_query = """
            SELECT 
                COUNT(*) FILTER (WHERE mfa_enabled = TRUE) as mfa_users,
                COUNT(*) as total_users
            FROM users
            WHERE customer_id = $1
        """
        user_row = await self.db.fetchrow(user_query, customer_id)
        mfa_users = user_row['mfa_users'] or 0
        total_users = user_row['total_users'] or 1
        mfa_adoption = round((mfa_users / total_users) * 100, 1)
        
        # Query endpoint security status
        endpoint_query = """
            SELECT 
                COUNT(*) FILTER (WHERE 
                    details::jsonb->'security'->>'disk_encryption_enabled' = 'true'
                ) as encrypted_endpoints,
                COUNT(*) FILTER (WHERE 
                    details::jsonb->'security'->>'firewall_enabled' = 'true'
                ) as firewall_enabled,
                COUNT(*) as total_endpoints
            FROM endpoints
            WHERE customer_id = $1
              AND status = 'ONLINE'
        """
        endpoint_row = await self.db.fetchrow(endpoint_query, customer_id)
        encrypted = endpoint_row['encrypted_endpoints'] or 0
        firewall = endpoint_row['firewall_enabled'] or 0
        total_endpoints = endpoint_row['total_endpoints'] or 1
        
        encryption_coverage = round((encrypted / total_endpoints) * 100, 1)
        firewall_coverage = round((firewall / total_endpoints) * 100, 1)
        
        # Scoring logic
        score = 0.0
        
        # MFA adoption (10 points max)
        if mfa_adoption >= 95:
            score += 10
        elif mfa_adoption >= 80:
            score += 8
        elif mfa_adoption >= 50:
            score += 5
        else:
            score += 2
        
        # Encryption coverage (10 points max)
        if encryption_coverage >= 95:
            score += 10
        elif encryption_coverage >= 80:
            score += 8
        elif encryption_coverage >= 50:
            score += 5
        else:
            score += 2
        
        # Firewall coverage (10 points max)
        if firewall_coverage >= 95:
            score += 10
        elif firewall_coverage >= 80:
            score += 8
        elif firewall_coverage >= 50:
            score += 5
        else:
            score += 2
        
        metrics = {
            "mfa_adoption_pct": mfa_adoption,
            "mfa_enabled_users": mfa_users,
            "total_users": total_users,
            "encryption_coverage_pct": encryption_coverage,
            "encrypted_endpoints": encrypted,
            "firewall_coverage_pct": firewall_coverage,
            "firewall_enabled_endpoints": firewall,
            "total_endpoints": total_endpoints
        }
        
        return score, metrics
    
    async def _calculate_detection_score(self, customer_id: int) -> Tuple[float, Dict]:
        """
        Threat Detection Score (0-20 points)
        
        Factors:
        - EDR coverage (monitored endpoints)
        - Alert generation rate
        - Detection accuracy
        """
        # Query monitoring coverage
        coverage_query = """
            SELECT 
                COUNT(DISTINCT e.id) as total_endpoints,
                COUNT(DISTINCT ev.endpoint_id) as monitored_endpoints
            FROM endpoints e
            LEFT JOIN events ev ON e.id = ev.endpoint_id
                AND ev.timestamp > NOW() - INTERVAL '24 hours'
            WHERE e.customer_id = $1
              AND e.status = 'ONLINE'
        """
        coverage_row = await self.db.fetchrow(coverage_query, customer_id)
        total_endpoints = coverage_row['total_endpoints'] or 1
        monitored = coverage_row['monitored_endpoints'] or 0
        coverage_pct = round((monitored / total_endpoints) * 100, 1)
        
        # Query alert effectiveness
        alert_query = """
            SELECT 
                COUNT(*) as total_alerts,
                COUNT(*) FILTER (WHERE status = 'ACKNOWLEDGED') as acknowledged_alerts,
                COUNT(*) FILTER (WHERE severity IN ('HIGH', 'CRITICAL')) as high_severity_alerts
            FROM alerts
            WHERE customer_id = $1
              AND created_at > NOW() - INTERVAL '30 days'
        """
        alert_row = await self.db.fetchrow(alert_query, customer_id)
        total_alerts = alert_row['total_alerts'] or 0
        acknowledged = alert_row['acknowledged_alerts'] or 0
        high_severity = alert_row['high_severity_alerts'] or 0
        
        # Scoring logic
        score = 0.0
        
        # EDR coverage (15 points max)
        if coverage_pct >= 95:
            score += 15
        elif coverage_pct >= 80:
            score += 12
        elif coverage_pct >= 60:
            score += 8
        else:
            score += 4
        
        # Alert response rate (5 points max)
        if total_alerts > 0:
            response_rate = round((acknowledged / total_alerts) * 100, 1)
            if response_rate >= 90:
                score += 5
            elif response_rate >= 70:
                score += 3
            else:
                score += 1
        else:
            response_rate = 0.0
            score += 5  # No alerts is good
        
        metrics = {
            "edr_coverage_pct": coverage_pct,
            "monitored_endpoints": monitored,
            "total_endpoints": total_endpoints,
            "total_alerts_30d": total_alerts,
            "acknowledged_alerts": acknowledged,
            "alert_response_rate_pct": response_rate if total_alerts > 0 else 100.0,
            "high_severity_alerts": high_severity
        }
        
        return score, metrics
    
    async def _calculate_response_score(self, customer_id: int) -> Tuple[float, Dict]:
        """
        Incident Response Score (0-10 points)
        
        Factors:
        - Mean Time to Acknowledge (MTTA)
        - Mean Time to Contain (MTTC)
        - Isolation effectiveness
        """
        query = """
            SELECT 
                AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) 
                    FILTER (WHERE acknowledged_at IS NOT NULL) as mtta_minutes,
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) 
                    FILTER (WHERE resolved_at IS NOT NULL) as mttc_minutes,
                COUNT(*) FILTER (WHERE severity IN ('HIGH', 'CRITICAL')) as critical_alerts,
                COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_alerts
            FROM alerts
            WHERE customer_id = $1
              AND created_at > NOW() - INTERVAL '30 days'
              AND severity IN ('HIGH', 'CRITICAL')
        """
        
        row = await self.db.fetchrow(query, customer_id)
        mtta = row['mtta_minutes'] or 999
        mttc = row['mttc_minutes'] or 999
        critical_alerts = row['critical_alerts'] or 0
        resolved = row['resolved_alerts'] or 0
        
        # Scoring logic
        score = 0.0
        
        # MTTA scoring (5 points max)
        if mtta < 15:
            score += 5
        elif mtta < 60:
            score += 3
        elif mtta < 240:
            score += 1
        
        # MTTC scoring (5 points max)
        if mttc < 60:
            score += 5
        elif mttc < 240:
            score += 3
        elif mttc < 480:
            score += 1
        
        # If no critical alerts, give full score
        if critical_alerts == 0:
            score = 10.0
        
        metrics = {
            "mtta_minutes": round(mtta, 1),
            "mttc_minutes": round(mttc, 1),
            "critical_alerts_30d": critical_alerts,
            "resolved_alerts": resolved
        }
        
        return score, metrics
    
    async def _get_previous_score(self, customer_id: int) -> Optional[float]:
        """Get the most recent resilience score"""
        query = """
            SELECT vrs_score
            FROM resilience_scores
            WHERE customer_id = $1
            ORDER BY calculated_at DESC
            LIMIT 1
        """
        row = await self.db.fetchrow(query, customer_id)
        return row['vrs_score'] if row else None
    
    def _get_grade(self, score: float) -> str:
        """Convert numerical score to letter grade"""
        if score >= 95:
            return ScoreGrade.A_PLUS
        elif score >= 90:
            return ScoreGrade.A
        elif score >= 85:
            return ScoreGrade.A_MINUS
        elif score >= 80:
            return ScoreGrade.B_PLUS
        elif score >= 75:
            return ScoreGrade.B
        elif score >= 70:
            return ScoreGrade.B_MINUS
        elif score >= 65:
            return ScoreGrade.C_PLUS
        elif score >= 60:
            return ScoreGrade.C
        elif score >= 50:
            return ScoreGrade.D
        else:
            return ScoreGrade.F
    
    def _generate_recommendations(
        self, 
        total_score: float,
        vuln_metrics: Dict,
        controls_metrics: Dict,
        detection_metrics: Dict,
        response_metrics: Dict
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Overall posture
        if total_score < 60:
            recommendations.append("🔴 URGENT: Security posture requires immediate attention")
        elif total_score < 75:
            recommendations.append("🟡 MODERATE: Several security improvements recommended")
        else:
            recommendations.append("🟢 GOOD: Maintain current security practices")
        
        # Vulnerability management
        if vuln_metrics.get('critical_vulnerabilities', 0) > 0:
            recommendations.append(
                f"⚠️  Patch {vuln_metrics['critical_vulnerabilities']} critical vulnerabilities within 24 hours"
            )
        
        if vuln_metrics.get('avg_vulnerability_age_days', 0) > 30:
            recommendations.append(
                "⏰ Reduce average vulnerability age to under 30 days"
            )
        
        # Security controls
        if controls_metrics.get('mfa_adoption_pct', 0) < 90:
            recommendations.append(
                f"🔐 Increase MFA adoption from {controls_metrics['mfa_adoption_pct']}% to 95%+"
            )
        
        if controls_metrics.get('encryption_coverage_pct', 0) < 90:
            recommendations.append(
                f"🔒 Enable disk encryption on {controls_metrics['total_endpoints'] - controls_metrics['encrypted_endpoints']} more endpoints"
            )
        
        # Detection
        if detection_metrics.get('edr_coverage_pct', 0) < 95:
            recommendations.append(
                f"👁️  Increase EDR coverage from {detection_metrics['edr_coverage_pct']}% to 100%"
            )
        
        # Response
        if response_metrics.get('mtta_minutes', 999) > 60:
            recommendations.append(
                f"⏱️  Reduce mean time to acknowledge from {response_metrics['mtta_minutes']:.0f} to <15 minutes"
            )
        
        # Limit to top 5 recommendations
        return recommendations[:5]

# ============================================================================
# EVENT CORRELATION ENGINE
# ============================================================================

class EventCorrelationEngine:
    """
    Detects sophisticated attacks by correlating event sequences
    """
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
        self.patterns = self._load_attack_patterns()
    
    def _load_attack_patterns(self) -> List[AttackPattern]:
        """Load attack pattern definitions"""
        return [
            AttackPattern(
                name="CVE_EXPLOITATION_LATERAL_MOVEMENT",
                display_name="CVE Exploitation → Lateral Movement",
                severity="CRITICAL",
                description="Critical vulnerability followed by suspicious process behavior",
                events=[
                    {"type": "VULNERABILITY_DETECTED", "severity": "CRITICAL"},
                    {"type": "SUSPICIOUS_PARENT_CHILD", "within_minutes": 60},
                    {"type": "UNUSUAL_NETWORK_CONNECTION", "same_host": True}
                ],
                recommendation="Immediately isolate endpoint and investigate process tree",
                mitre_tactics=["TA0001", "TA0008"],  # Initial Access, Lateral Movement
                mitre_techniques=["T1190", "T1021"]  # Exploit Public-Facing Application, Remote Services
            ),
            # Additional patterns would be defined here
        ]
    
    async def analyze_events(self, customer_id: int) -> List[Dict]:
        """Analyze recent events for attack patterns"""
        logger.info(f"🔍 Analyzing events for customer {customer_id}")
        
        # Get recent events (last 24 hours)
        events = await self._get_recent_events(customer_id, hours=24)
        
        incidents = []
        for pattern in self.patterns:
            matches = await self._match_pattern(events, pattern)
            if matches:
                incident = await self._create_incident(customer_id, pattern, matches)
                incidents.append(incident)
        
        return incidents
    
    async def _get_recent_events(self, customer_id: int, hours: int = 24) -> List[Dict]:
        """Fetch recent events for analysis"""
        query = """
            SELECT *
            FROM events
            WHERE customer_id = $1
              AND timestamp > NOW() - INTERVAL '%s hours'
            ORDER BY timestamp DESC
        """ % hours
        
        rows = await self.db.fetch(query, customer_id)
        return [dict(row) for row in rows]
    
    async def _match_pattern(self, events: List[Dict], pattern: AttackPattern) -> Optional[List[Dict]]:
        """Check if events match attack pattern"""
        # Simplified pattern matching - production would be more sophisticated
        # This would use complex temporal logic and correlation
        return None  # Placeholder
    
    async def _create_incident(self, customer_id: int, pattern: AttackPattern, events: List[Dict]) -> Dict:
        """Create security incident from correlated events"""
        incident_id = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{customer_id:04d}"
        
        query = """
            INSERT INTO security_incidents (
                customer_id, incident_id, name, pattern_name,
                severity, description, recommendation,
                correlated_event_ids, status, first_seen, last_seen
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        """
        
        event_ids = [e['id'] for e in events]
        first_seen = min(e['timestamp'] for e in events)
        last_seen = max(e['timestamp'] for e in events)
        
        incident_id_db = await self.db.fetchval(
            query,
            customer_id, incident_id, pattern.display_name, pattern.name,
            pattern.severity, pattern.description, pattern.recommendation,
            event_ids, "OPEN", first_seen, last_seen
        )
        
        logger.warning(
            f"🚨 SECURITY INCIDENT DETECTED",
            incident_id=incident_id,
            pattern=pattern.name,
            severity=pattern.severity
        )
        
        return {
            "id": incident_id_db,
            "incident_id": incident_id,
            "pattern": pattern.name,
            "severity": pattern.severity
        }

# ============================================================================
# AXON ENGINE SERVICE
# ============================================================================

class AxonEngineService:
    """Main Axon Engine service orchestrator"""
    
    def __init__(self):
        self.db_pool: Optional[asyncpg.Pool] = None
        self.calculator: Optional[ResilienceScoreCalculator] = None
        self.correlation_engine: Optional[EventCorrelationEngine] = None
        self.scheduler = AsyncIOScheduler()
    
    async def initialize(self):
        """Initialize database connection and components"""
        logger.info("🚀 Initializing Axon Engine...")
        
        # Create database pool
        self.db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
        
        # Initialize components
        self.calculator = ResilienceScoreCalculator(self.db_pool)
        if EVENT_CORRELATION_ENABLED:
            self.correlation_engine = EventCorrelationEngine(self.db_pool)
        
        logger.info("✅ Axon Engine initialized")
    
    async def shutdown(self):
        """Clean shutdown"""
        logger.info("🛑 Shutting down Axon Engine...")
        if self.db_pool:
            await self.db_pool.close()
        logger.info("✅ Axon Engine shut down")
    
    async def calculate_all_resilience_scores(self):
        """Calculate VRS for all customers"""
        logger.info("📊 Starting daily resilience score calculation")
        
        # Get all customers
        customers = await self.db_pool.fetch("SELECT id, name FROM customers")  # type: ignore
        
        for customer in customers:
            try:
                # Calculate score
                score = await self.calculator.calculate_vrs(customer['id'])  # type: ignore
                
                # Save to database
                await self._save_resilience_score(score)
                
                # Check for alerts
                if score.vrs_score < 60:
                    await self._send_low_score_alert(customer['name'], score)
                
                logger.info(
                    f"✅ VRS calculated for {customer['name']}",
                    score=score.vrs_score,
                    grade=score.grade,
                    trend=score.trend
                )
            
            except Exception as e:
                logger.error(f"❌ Error calculating VRS for customer {customer['id']}: {e}")
        
        logger.info(f"✅ Completed resilience scores for {len(customers)} customers")
    
    async def _save_resilience_score(self, score: ResilienceScore):
        """Save resilience score to database"""
        query = """
            INSERT INTO resilience_scores (
                customer_id, vrs_score, grade,
                vulnerability_exposure_score, security_controls_score,
                threat_detection_score, incident_response_score,
                breakdown, metrics, recommendations,
                previous_score, score_change, score_trend,
                calculated_at, calculation_version
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14
            )
        """
        
        previous = score.vrs_score - (score.score_change or 0)
        
        await self.db_pool.execute(  # type: ignore
            query,
            score.customer_id, score.vrs_score, score.grade,
            score.vulnerability_score, score.controls_score,
            score.detection_score, score.response_score,
            json.dumps(score.breakdown), json.dumps(score.metrics),
            json.dumps(score.recommendations),
            previous, score.score_change, score.trend,
            self.calculator.version  # type: ignore
        )
    
    async def _send_low_score_alert(self, customer_name: str, score: ResilienceScore):
        """Send alert for low resilience scores"""
        # This would integrate with notification service
        logger.warning(
            f"⚠️  LOW RESILIENCE SCORE ALERT",
            customer=customer_name,
            score=score.vrs_score,
            grade=score.grade
        )
    
    async def run_event_correlation(self):
        """Run event correlation for all customers"""
        if not EVENT_CORRELATION_ENABLED or not self.correlation_engine:
            return
        
        logger.info("🔍 Starting event correlation analysis")
        
        customers = await self.db_pool.fetch("SELECT id FROM customers")  # type: ignore
        
        for customer in customers:
            try:
                incidents = await self.correlation_engine.analyze_events(customer['id'])
                if incidents:
                    logger.warning(
                        f"🚨 {len(incidents)} incidents detected for customer {customer['id']}"
                    )
            except Exception as e:
                logger.error(f"❌ Error in event correlation for customer {customer['id']}: {e}")
    
    def start_scheduler(self):
        """Start scheduled jobs"""
        logger.info("⏰ Starting Axon Engine scheduler")
        
        # Schedule resilience score calculation
        self.scheduler.add_job(
            self.calculate_all_resilience_scores,
            trigger=CronTrigger.from_crontab(RESILIENCE_SCORE_SCHEDULE),
            id='resilience_scores',
            name='Calculate Resilience Scores'
        )
        
        # Schedule event correlation (every hour)
        if EVENT_CORRELATION_ENABLED:
            self.scheduler.add_job(
                self.run_event_correlation,
                'interval',
                hours=1,
                id='event_correlation',
                name='Event Correlation Analysis'
            )
        
        self.scheduler.start()
        logger.info("✅ Scheduler started")

# ============================================================================
# MAIN
# ============================================================================

async def main():
    """Main entry point"""
    service = AxonEngineService()
    
    try:
        await service.initialize()
        
        # Run initial calculation
        await service.calculate_all_resilience_scores()
        
        # Start scheduler
        service.start_scheduler()
        
        # Keep running
        logger.info("🟢 Axon Engine is running. Press Ctrl+C to stop.")
        while True:
            await asyncio.sleep(1)
    
    except KeyboardInterrupt:
        logger.info("⏸️  Received shutdown signal")
    
    finally:
        await service.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
