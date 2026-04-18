"""
Observability Stack - Incident Tracking System
Monitors, tracks, and analyzes infrastructure incidents in real-time
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
from collections import defaultdict

class SeverityLevel(Enum):
    """Incident severity levels."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class IncidentStatus(Enum):
    """Incident lifecycle status."""
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    MITIGATING = "MITIGATING"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Incident:
    """Represents a single infrastructure incident."""
    
    def __init__(self, incident_id: str, building_id: int, severity: SeverityLevel):
        self.incident_id = incident_id
        self.building_id = building_id
        self.severity = severity
        self.status = IncidentStatus.OPEN
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.description = ""
        self.root_cause = None
        self.affected_systems = []
        self.timeline = []
        self.resolution = None
    
    def add_timeline_event(self, event: str):
        """Add event to incident timeline."""
        self.timeline.append({
            "timestamp": datetime.now().isoformat(),
            "event": event
        })
        self.updated_at = datetime.now()
    
    def update_status(self, new_status: IncidentStatus, note: str = ""):
        """Update incident status with note."""
        self.status = new_status
        self.updated_at = datetime.now()
        self.add_timeline_event(f"Status changed to {new_status.value}: {note}")
    
    def resolve(self, resolution: str):
        """Mark incident as resolved."""
        self.resolution = resolution
        self.update_status(IncidentStatus.RESOLVED, f"Resolved: {resolution}")
    
    def to_dict(self) -> Dict:
        """Convert incident to dictionary."""
        return {
            "incident_id": self.incident_id,
            "building_id": self.building_id,
            "severity": self.severity.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "description": self.description,
            "root_cause": self.root_cause,
            "affected_systems": self.affected_systems,
            "timeline": self.timeline,
            "resolution": self.resolution,
            "duration_minutes": (self.updated_at - self.created_at).total_seconds() / 60
        }

class ObservabilityStack:
    """Central incident tracking and monitoring system."""
    
    def __init__(self, retention_days: int = 30):
        self.incidents: Dict[str, Incident] = {}
        self.retention_days = retention_days
        self.metrics = defaultdict(int)
    
    def create_incident(self, building_id: int, severity: SeverityLevel, description: str) -> Incident:
        """Create new incident."""
        incident_id = f"INC-{building_id}-{len(self.incidents)+1}-{int(datetime.now().timestamp())}"
        incident = Incident(incident_id, building_id, severity)
        incident.description = description
        incident.add_timeline_event("Incident created")
        
        self.incidents[incident_id] = incident
        self.metrics[f"incidents_{severity.value.lower()}"] += 1
        
        return incident
    
    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Retrieve incident by ID."""
        return self.incidents.get(incident_id)
    
    def get_building_incidents(self, building_id: int) -> List[Incident]:
        """Get all incidents for a building."""
        return [inc for inc in self.incidents.values() if inc.building_id == building_id]
    
    def get_active_incidents(self) -> List[Incident]:
        """Get all active (non-resolved) incidents."""
        return [inc for inc in self.incidents.values() 
                if inc.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]]
    
    def get_incidents_by_severity(self, severity: SeverityLevel) -> List[Incident]:
        """Get incidents filtered by severity."""
        return [inc for inc in self.incidents.values() if inc.severity == severity]
    
    def escalate_incident(self, incident_id: str, reason: str):
        """Escalate incident severity."""
        incident = self.get_incident(incident_id)
        if incident:
            incident.add_timeline_event(f"Escalated: {reason}")
    
    def acknowledge_incident(self, incident_id: str):
        """Acknowledge incident is being investigated."""
        incident = self.get_incident(incident_id)
        if incident:
            incident.update_status(IncidentStatus.INVESTIGATING, "Incident acknowledged")
    
    def generate_incident_report(self, days: int = 7) -> Dict:
        """Generate incident report for time period."""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        recent_incidents = [inc for inc in self.incidents.values() 
                           if inc.created_at >= cutoff_date]
        
        severity_count = defaultdict(int)
        for incident in recent_incidents:
            severity_count[incident.severity.value] += 1
        
        avg_resolution_time = 0
        resolved = [inc for inc in recent_incidents if inc.resolution]
        if resolved:
            total_time = sum((inc.updated_at - inc.created_at).total_seconds() for inc in resolved)
            avg_resolution_time = total_time / len(resolved) / 60  # minutes
        
        return {
            "report_period_days": days,
            "total_incidents": len(recent_incidents),
            "by_severity": dict(severity_count),
            "resolved_incidents": len(resolved),
            "active_incidents": len(self.get_active_incidents()),
            "avg_resolution_time_minutes": round(avg_resolution_time, 2),
            "metrics": dict(self.metrics)
        }
    
    def cleanup_old_incidents(self):
        """Remove incidents older than retention period."""
        cutoff_date = datetime.now() - timedelta(days=self.retention_days)
        old_incidents = [iid for iid, inc in self.incidents.items() 
                        if inc.created_at < cutoff_date and inc.status == IncidentStatus.CLOSED]
        
        for iid in old_incidents:
            del self.incidents[iid]
        
        return len(old_incidents)

# Global instance
observability_stack = ObservabilityStack()

def create_critical_alert(building_id: int, description: str) -> Incident:
    """Create critical severity incident."""
    return observability_stack.create_incident(
        building_id, 
        SeverityLevel.CRITICAL, 
        description
    )

def get_active_incident_count() -> int:
    """Get count of active incidents."""
    return len(observability_stack.get_active_incidents())

def get_incident_health_score() -> float:
    """Calculate health score based on incidents (0-100)."""
    active = len(observability_stack.get_active_incidents())
    critical = len(observability_stack.get_incidents_by_severity(SeverityLevel.CRITICAL))
    
    # Deduct points for active incidents
    score = 100.0
    score -= active * 5
    score -= critical * 15
    
    return max(0, min(100, score))
