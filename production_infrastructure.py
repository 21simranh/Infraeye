"""
Production Infrastructure - Session Management
Manages user sessions, building sessions, and monitoring contexts
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from enum import Enum

class SessionType(Enum):
    """Types of monitoring sessions."""
    MONITORING = "MONITORING"
    ANALYSIS = "ANALYSIS"
    MAINTENANCE = "MAINTENANCE"
    EMERGENCY = "EMERGENCY"
    INSPECTION = "INSPECTION"

class Session:
    """Represents a monitoring or analysis session."""
    
    def __init__(self, session_id: str, user_id: str, building_id: int, session_type: SessionType):
        self.session_id = session_id
        self.user_id = user_id
        self.building_id = building_id
        self.session_type = session_type
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.is_active = True
        self.actions = []
        self.data_points_collected = 0
        self.alerts_triggered = 0
    
    def record_action(self, action: str, details: Dict = None):
        """Record an action in the session."""
        self.actions.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details or {}
        })
        self.last_activity = datetime.now()
    
    def add_data_point(self):
        """Increment data points collected."""
        self.data_points_collected += 1
        self.last_activity = datetime.now()
    
    def trigger_alert(self):
        """Increment alert count."""
        self.alerts_triggered += 1
        self.last_activity = datetime.now()
    
    def close(self):
        """Close session."""
        self.is_active = False
        self.record_action("Session closed")
    
    def get_duration_seconds(self) -> int:
        """Get session duration in seconds."""
        return int((datetime.now() - self.created_at).total_seconds())
    
    def get_idle_seconds(self) -> int:
        """Get seconds since last activity."""
        return int((datetime.now() - self.last_activity).total_seconds())
    
    def to_dict(self) -> Dict:
        """Convert session to dictionary."""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "building_id": self.building_id,
            "session_type": self.session_type.value,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active,
            "duration_seconds": self.get_duration_seconds(),
            "idle_seconds": self.get_idle_seconds(),
            "data_points_collected": self.data_points_collected,
            "alerts_triggered": self.alerts_triggered,
            "action_count": len(self.actions)
        }

class ProductionInfrastructure:
    """Manages user and building monitoring sessions."""
    
    def __init__(self, session_timeout_minutes: int = 30):
        self.sessions: Dict[str, Session] = {}
        self.user_sessions: Dict[str, List[str]] = {}  # user_id -> session_ids
        self.building_sessions: Dict[int, List[str]] = {}  # building_id -> session_ids
        self.session_timeout_minutes = session_timeout_minutes
    
    def create_session(self, user_id: str, building_id: int, session_type: SessionType = SessionType.MONITORING) -> Session:
        """Create new monitoring session."""
        session_id = f"SES-{uuid.uuid4().hex[:12].upper()}"
        session = Session(session_id, user_id, building_id, session_type)
        
        self.sessions[session_id] = session
        
        # Track by user
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = []
        self.user_sessions[user_id].append(session_id)
        
        # Track by building
        if building_id not in self.building_sessions:
            self.building_sessions[building_id] = []
        self.building_sessions[building_id].append(session_id)
        
        session.record_action("Session created", {"session_type": session_type.value})
        return session
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """Retrieve session by ID."""
        return self.sessions.get(session_id)
    
    def get_user_sessions(self, user_id: str) -> List[Session]:
        """Get all sessions for a user."""
        session_ids = self.user_sessions.get(user_id, [])
        return [self.sessions[sid] for sid in session_ids if sid in self.sessions]
    
    def get_building_sessions(self, building_id: int) -> List[Session]:
        """Get all sessions for a building."""
        session_ids = self.building_sessions.get(building_id, [])
        return [self.sessions[sid] for sid in session_ids if sid in self.sessions]
    
    def get_active_sessions(self) -> List[Session]:
        """Get all active sessions."""
        return [s for s in self.sessions.values() if s.is_active]
    
    def check_session_timeout(self):
        """Close sessions that exceeded idle timeout."""
        timeout_threshold = self.session_timeout_minutes * 60
        timed_out = []
        
        for session in self.sessions.values():
            if session.is_active and session.get_idle_seconds() > timeout_threshold:
                session.close()
                timed_out.append(session.session_id)
        
        return timed_out
    
    def end_session(self, session_id: str):
        """Explicitly end a session."""
        session = self.get_session(session_id)
        if session:
            session.close()
    
    def generate_infrastructure_report(self) -> Dict:
        """Generate infrastructure usage report."""
        active = self.get_active_sessions()
        total_data = sum(s.data_points_collected for s in self.sessions.values())
        total_alerts = sum(s.alerts_triggered for s in self.sessions.values())
        
        return {
            "total_sessions": len(self.sessions),
            "active_sessions": len(active),
            "total_data_points": total_data,
            "total_alerts_triggered": total_alerts,
            "unique_users": len(self.user_sessions),
            "monitored_buildings": len(self.building_sessions),
            "avg_session_duration_minutes": round(
                sum(s.get_duration_seconds() for s in self.sessions.values()) / 
                len(self.sessions) / 60 if self.sessions else 0, 2
            ) if self.sessions else 0
        }
    
    def cleanup_closed_sessions(self, older_than_minutes: int = 1440):  # 24 hours
        """Remove closed sessions older than specified time."""
        cutoff_time = datetime.now() - timedelta(minutes=older_than_minutes)
        to_remove = []
        
        for sid, session in self.sessions.items():
            if not session.is_active and session.created_at < cutoff_time:
                to_remove.append(sid)
        
        for sid in to_remove:
            del self.sessions[sid]
        
        return len(to_remove)

# Global instance
infrastructure = ProductionInfrastructure()

def create_monitoring_session(user_id: str, building_id: int) -> Session:
    """Convenience function to create monitoring session."""
    return infrastructure.create_session(user_id, building_id, SessionType.MONITORING)

def create_emergency_session(user_id: str, building_id: int) -> Session:
    """Create emergency response session."""
    return infrastructure.create_session(user_id, building_id, SessionType.EMERGENCY)

def get_session_count() -> int:
    """Get total active sessions."""
    return len(infrastructure.get_active_sessions())
