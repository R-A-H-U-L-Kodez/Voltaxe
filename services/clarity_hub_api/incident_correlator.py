"""
Incident Correlation Engine - Part of Axon Engine
Automatically groups related alerts into unified incidents to reduce alert fatigue
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict
import hashlib

class IncidentCorrelator:
    """
    Correlates related security events into unified incidents.
    Uses multiple correlation strategies to identify related alerts.
    """
    
    # Time window for correlation (alerts within this time are considered related)
    CORRELATION_WINDOW = timedelta(hours=2)
    
    # Correlation rules - define which event types are related
    CORRELATION_RULES = {
        'vulnerability': ['suspicious_behavior', 'network_anomaly', 'file_modification'],
        'suspicious_behavior': ['vulnerability', 'malware_detected', 'privilege_escalation'],
        'malware_detected': ['suspicious_behavior', 'network_anomaly', 'data_exfiltration'],
        'privilege_escalation': ['suspicious_behavior', 'lateral_movement', 'credential_access'],
        'network_anomaly': ['vulnerability', 'malware_detected', 'data_exfiltration'],
        'data_exfiltration': ['network_anomaly', 'malware_detected', 'credential_access'],
        'lateral_movement': ['privilege_escalation', 'credential_access', 'suspicious_behavior'],
        'credential_access': ['privilege_escalation', 'lateral_movement', 'data_exfiltration']
    }
    
    # Severity weights for incident scoring
    SEVERITY_WEIGHTS = {
        'critical': 10,
        'high': 7,
        'medium': 4,
        'low': 2
    }
    
    @staticmethod
    def generate_incident_id(alerts: List[Dict[str, Any]]) -> str:
        """Generate a unique incident ID based on correlated alerts"""
        # Create a hash from hostname, earliest timestamp, and alert types
        if not alerts:
            return f"INC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        hostnames = sorted(set(alert.get('hostname', 'unknown') for alert in alerts))
        alert_types = sorted(set(alert.get('event_type', 'unknown') for alert in alerts))
        
        hash_input = f"{'-'.join(hostnames)}-{'-'.join(alert_types)}"
        hash_value = hashlib.md5(hash_input.encode()).hexdigest()[:8]
        
        return f"INC-{hash_value.upper()}"
    
    @staticmethod
    def calculate_incident_severity(alerts: List[Dict[str, Any]]) -> str:
        """Calculate overall incident severity based on constituent alerts"""
        severity_scores = []
        
        for alert in alerts:
            severity = alert.get('severity', 'low')
            if isinstance(severity, str):
                severity_scores.append(
                    IncidentCorrelator.SEVERITY_WEIGHTS.get(severity.lower(), 1)
                )
        
        if not severity_scores:
            return 'low'
        
        avg_score = sum(severity_scores) / len(severity_scores)
        max_score = max(severity_scores)
        
        # Use weighted combination: 70% max, 30% average
        final_score = (max_score * 0.7) + (avg_score * 0.3)
        
        if final_score >= 8:
            return 'critical'
        elif final_score >= 6:
            return 'high'
        elif final_score >= 3:
            return 'medium'
        else:
            return 'low'
    
    @staticmethod
    def are_events_related(event1: Dict[str, Any], event2: Dict[str, Any]) -> bool:
        """
        Determine if two events are related based on multiple criteria:
        1. Same hostname
        2. Event types are correlated per rules
        3. Within time window
        """
        # Same hostname check
        hostname1 = event1.get('hostname', '').lower()
        hostname2 = event2.get('hostname', '').lower()
        
        if not hostname1 or not hostname2 or hostname1 != hostname2:
            return False
        
        # Time window check
        time1 = event1.get('timestamp')
        time2 = event2.get('timestamp')
        
        if time1 and time2:
            if isinstance(time1, str):
                time1 = datetime.fromisoformat(time1.replace('Z', '+00:00'))
            if isinstance(time2, str):
                time2 = datetime.fromisoformat(time2.replace('Z', '+00:00'))
            
            time_diff = abs(time1 - time2)
            if time_diff > IncidentCorrelator.CORRELATION_WINDOW:
                return False
        
        # Event type correlation check
        type1 = event1.get('event_type', '').lower()
        type2 = event2.get('event_type', '').lower()
        
        # Check if event types are related according to correlation rules
        related_types = IncidentCorrelator.CORRELATION_RULES.get(type1, [])
        if type2 in related_types or type1 == type2:
            return True
        
        # Reverse check
        related_types = IncidentCorrelator.CORRELATION_RULES.get(type2, [])
        if type1 in related_types:
            return True
        
        return False
    
    @staticmethod
    def correlate_alerts(alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Main correlation function - groups related alerts into incidents.
        
        Args:
            alerts: List of alert dictionaries
            
        Returns:
            List of incident dictionaries, each containing correlated alerts
        """
        if not alerts:
            return []
        
        # Sort alerts by timestamp
        sorted_alerts = sorted(
            alerts,
            key=lambda x: x.get('timestamp', datetime.min)
        )
        
        # Use Union-Find algorithm for grouping
        incidents_map = {}  # alert_id -> incident_group_id
        incident_groups = defaultdict(list)
        group_counter = 0
        
        for i, alert in enumerate(sorted_alerts):
            alert_id = alert.get('id', i)
            
            # Check if this alert is related to any existing groups
            matched_groups = set()
            
            for j, other_alert in enumerate(sorted_alerts[:i]):
                other_id = other_alert.get('id', j)
                
                if IncidentCorrelator.are_events_related(alert, other_alert):
                    if other_id in incidents_map:
                        matched_groups.add(incidents_map[other_id])
            
            if matched_groups:
                # Merge all matched groups into the first one
                primary_group = min(matched_groups)
                
                for group_id in matched_groups:
                    if group_id != primary_group:
                        # Merge group into primary
                        for alert_to_move in incident_groups[group_id]:
                            move_id = alert_to_move.get('id', hash(str(alert_to_move)))
                            incidents_map[move_id] = primary_group
                            incident_groups[primary_group].append(alert_to_move)
                        del incident_groups[group_id]
                
                # Add current alert to primary group
                incidents_map[alert_id] = primary_group
                incident_groups[primary_group].append(alert)
            else:
                # Create new group
                incidents_map[alert_id] = group_counter
                incident_groups[group_counter].append(alert)
                group_counter += 1
        
        # Build incident objects
        incidents = []
        
        for group_id, grouped_alerts in incident_groups.items():
            if not grouped_alerts:
                continue
            
            # Calculate incident metadata
            incident_severity = IncidentCorrelator.calculate_incident_severity(grouped_alerts)
            incident_id = IncidentCorrelator.generate_incident_id(grouped_alerts)
            
            # Get time range
            timestamps = [a.get('timestamp') for a in grouped_alerts if a.get('timestamp')]
            if timestamps:
                first_seen = min(timestamps)
                last_seen = max(timestamps)
            else:
                first_seen = last_seen = datetime.utcnow()
            
            # Get affected hosts
            hostnames = list(set(a.get('hostname') for a in grouped_alerts if a.get('hostname')))
            
            # Generate incident title
            event_types = list(set(a.get('event_type') for a in grouped_alerts if a.get('event_type')))
            if len(event_types) == 1:
                title = f"{event_types[0].replace('_', ' ').title()} on {hostnames[0] if hostnames else 'Unknown'}"
            else:
                title = f"Multi-Stage Attack on {hostnames[0] if hostnames else 'Unknown Host'}"
            
            # Generate incident description
            description = IncidentCorrelator.generate_incident_description(grouped_alerts)
            
            # Build incident object
            incident = {
                'incident_id': incident_id,
                'title': title,
                'description': description,
                'severity': incident_severity,
                'status': 'open',
                'alert_count': len(grouped_alerts),
                'affected_hosts': hostnames,
                'event_types': event_types,
                'first_seen': first_seen.isoformat() if isinstance(first_seen, datetime) else str(first_seen),
                'last_seen': last_seen.isoformat() if isinstance(last_seen, datetime) else str(last_seen),
                'alerts': grouped_alerts,
                'kill_chain_stage': IncidentCorrelator.determine_kill_chain_stage(grouped_alerts),
                'recommended_actions': IncidentCorrelator.generate_recommendations(grouped_alerts)
            }
            
            incidents.append(incident)
        
        # Sort by severity and time
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        incidents.sort(
            key=lambda x: (
                severity_order.get(x['severity'], 4),
                x['last_seen']
            ),
            reverse=True
        )
        
        return incidents
    
    @staticmethod
    def generate_incident_description(alerts: List[Dict[str, Any]]) -> str:
        """Generate a human-readable incident description"""
        if len(alerts) == 1:
            alert = alerts[0]
            return f"Single {alert.get('event_type', 'event')} detected: {alert.get('details', 'No details available')}"
        
        event_types = [a.get('event_type', 'unknown') for a in alerts]
        hostnames = list(set(a.get('hostname') for a in alerts if a.get('hostname')))
        
        description = f"Correlated incident involving {len(alerts)} related alerts "
        description += f"across {len(hostnames)} host(s). "
        description += f"Event sequence: {' → '.join(event_types[:5])}"
        
        if len(event_types) > 5:
            description += f" ... and {len(event_types) - 5} more events."
        
        return description
    
    @staticmethod
    def determine_kill_chain_stage(alerts: List[Dict[str, Any]]) -> str:
        """Map event types to MITRE ATT&CK kill chain stages"""
        kill_chain_map = {
            'vulnerability': 'Initial Access',
            'malware_detected': 'Execution',
            'suspicious_behavior': 'Persistence',
            'privilege_escalation': 'Privilege Escalation',
            'credential_access': 'Credential Access',
            'lateral_movement': 'Lateral Movement',
            'data_exfiltration': 'Exfiltration',
            'network_anomaly': 'Command and Control'
        }
        
        stages = []
        for alert in alerts:
            event_type = alert.get('event_type', '').lower()
            if event_type in kill_chain_map:
                stages.append(kill_chain_map[event_type])
        
        if not stages:
            return 'Unknown'
        
        # Return the most advanced stage
        stage_order = [
            'Initial Access', 'Execution', 'Persistence', 
            'Privilege Escalation', 'Credential Access', 
            'Lateral Movement', 'Command and Control', 'Exfiltration'
        ]
        
        for stage in reversed(stage_order):
            if stage in stages:
                return stage
        
        return stages[0] if stages else 'Unknown'
    
    @staticmethod
    def generate_recommendations(alerts: List[Dict[str, Any]]) -> List[str]:
        """Generate recommended actions based on incident"""
        recommendations = []
        event_types = set(a.get('event_type', '').lower() for a in alerts)
        severity = IncidentCorrelator.calculate_incident_severity(alerts)
        
        # Generic recommendations based on severity
        if severity in ['critical', 'high']:
            recommendations.append("🚨 Immediate isolation of affected hosts recommended")
            recommendations.append("📞 Notify security team and incident response personnel")
        
        # Specific recommendations based on event types
        if 'malware_detected' in event_types:
            recommendations.append("🦠 Run full malware scan on affected systems")
            recommendations.append("🔒 Block malicious file hashes at network perimeter")
        
        if 'privilege_escalation' in event_types or 'credential_access' in event_types:
            recommendations.append("🔑 Force password reset for affected accounts")
            recommendations.append("🔐 Review and revoke suspicious access tokens")
        
        if 'data_exfiltration' in event_types:
            recommendations.append("🌐 Block egress traffic to suspicious destinations")
            recommendations.append("📊 Analyze data loss to determine scope of breach")
        
        if 'lateral_movement' in event_types:
            recommendations.append("🔍 Audit network segmentation and access controls")
            recommendations.append("🛡️ Enable enhanced logging on critical systems")
        
        if 'vulnerability' in event_types:
            recommendations.append("🔧 Apply security patches immediately")
            recommendations.append("🛠️ Implement virtual patching if updates unavailable")
        
        # Always add forensics recommendation for multi-alert incidents
        if len(alerts) > 1:
            recommendations.append("🔬 Preserve forensic evidence for investigation")
        
        return recommendations[:5]  # Limit to top 5 recommendations
