"""
Chaos Engine - Failure Injection System
Simulates infrastructure failures for risk testing and model training
"""

import random
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json

class ChaosEngine:
    """Injects controlled failures into building systems for testing."""
    
    def __init__(self, seed: int = 42):
        """Initialize chaos engine with optional seed for reproducibility."""
        random.seed(seed)
        np.random.seed(seed)
        self.failure_log = []
        self.failure_scenarios = [
            "structural_crack",
            "vibration_spike",
            "energy_surge",
            "load_imbalance",
            "foundation_shift",
            "water_damage",
            "corrosion",
            "fatigue_failure"
        ]
    
    def inject_failure(self, building_id: int, scenario: str = None, severity: float = 0.5) -> Dict:
        """
        Inject a failure into a building's metrics.
        
        Args:
            building_id: Target building ID
            scenario: Failure type (random if None)
            severity: Failure intensity (0-1)
        
        Returns:
            Dictionary with injected failure parameters
        """
        if scenario is None:
            scenario = random.choice(self.failure_scenarios)
        
        failure_event = {
            "building_id": building_id,
            "scenario": scenario,
            "severity": np.clip(severity, 0, 1),
            "timestamp": datetime.now().isoformat(),
            "impact": self._calculate_impact(scenario, severity)
        }
        
        self.failure_log.append(failure_event)
        return failure_event
    
    def _calculate_impact(self, scenario: str, severity: float) -> Dict[str, float]:
        """Calculate impact on building metrics based on failure scenario."""
        base_impacts = {
            "structural_crack": {"crack_width": 0.8, "risk_score": 0.9, "vibration": 0.3},
            "vibration_spike": {"vibration": 0.95, "risk_score": 0.7, "energy_consumption": 0.4},
            "energy_surge": {"energy_consumption": 0.85, "current_load": 0.8, "risk_score": 0.5},
            "load_imbalance": {"current_load": 0.9, "vibration": 0.6, "risk_score": 0.7},
            "foundation_shift": {"crack_width": 0.7, "vibration": 0.8, "risk_score": 0.95},
            "water_damage": {"crack_width": 0.6, "energy_consumption": 0.4, "risk_score": 0.6},
            "corrosion": {"crack_width": 0.5, "building_age": 0.1, "risk_score": 0.4},
            "fatigue_failure": {"vibration": 0.8, "crack_width": 0.75, "risk_score": 0.85}
        }
        
        base_impact = base_impacts.get(scenario, {})
        return {k: v * severity for k, v in base_impact.items()}
    
    def simulate_cascade_failure(self, building_id: int, initial_severity: float = 0.6) -> List[Dict]:
        """Simulate cascading failures across building systems."""
        cascade = []
        current_severity = initial_severity
        
        for i in range(random.randint(2, 4)):
            scenario = random.choice(self.failure_scenarios)
            failure = self.inject_failure(
                building_id, 
                scenario, 
                current_severity
            )
            cascade.append(failure)
            # Severity increases with cascade
            current_severity = min(current_severity + 0.15, 1.0)
        
        return cascade
    
    def generate_failure_report(self) -> Dict:
        """Generate comprehensive failure report."""
        if not self.failure_log:
            return {"total_failures": 0, "failures": []}
        
        failures_by_building = {}
        for failure in self.failure_log:
            bid = failure["building_id"]
            if bid not in failures_by_building:
                failures_by_building[bid] = []
            failures_by_building[bid].append(failure)
        
        return {
            "total_failures": len(self.failure_log),
            "unique_buildings": len(failures_by_building),
            "failures_by_building": failures_by_building,
            "report_generated": datetime.now().isoformat()
        }

# Global instance
chaos_engine = ChaosEngine()

def inject_test_failure(building_id: int, scenario: str = None) -> Dict:
    """Convenience function to inject failure."""
    return chaos_engine.inject_failure(building_id, scenario, severity=random.random())

def simulate_infrastructure_incident(building_id: int) -> Dict:
    """Simulate a complete infrastructure incident."""
    return {
        "incident_id": f"INC-{building_id}-{datetime.now().timestamp()}",
        "building_id": building_id,
        "cascade_failures": chaos_engine.simulate_cascade_failure(building_id),
        "timestamp": datetime.now().isoformat()
    }
