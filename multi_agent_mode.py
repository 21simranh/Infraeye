"""
Multi-Agent Mode - Distributed AI Agent System
Coordinates multiple specialized AI agents for infrastructure analysis
"""

from typing import Dict, List, Callable, Any
from enum import Enum
from datetime import datetime
import json

class AgentType(Enum):
    """Types of specialized AI agents."""
    RISK_ANALYZER = "RISK_ANALYZER"
    PREDICTION_ENGINE = "PREDICTION_ENGINE"
    ANOMALY_DETECTOR = "ANOMALY_DETECTOR"
    RECOMMENDATION_ENGINE = "RECOMMENDATION_ENGINE"
    OPTIMIZATION_AGENT = "OPTIMIZATION_AGENT"
    EMERGENCY_RESPONDER = "EMERGENCY_RESPONDER"

class Agent:
    """Base class for specialized AI agents."""
    
    def __init__(self, agent_id: str, agent_type: AgentType, name: str):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.name = name
        self.is_active = True
        self.tasks_completed = 0
        self.tasks_failed = 0
        self.average_response_time_ms = 0
        self.last_activity = datetime.now()
    
    def execute(self, data: Dict) -> Dict:
        """Execute agent logic on data."""
        raise NotImplementedError
    
    def record_task_completion(self, response_time_ms: float):
        """Record successful task completion."""
        self.tasks_completed += 1
        # Update running average response time
        total_time = self.average_response_time_ms * (self.tasks_completed - 1)
        self.average_response_time_ms = (total_time + response_time_ms) / self.tasks_completed
        self.last_activity = datetime.now()
    
    def record_task_failure(self):
        """Record task failure."""
        self.tasks_failed += 1
        self.last_activity = datetime.now()
    
    def get_health_score(self) -> float:
        """Calculate agent health (0-100)."""
        total_tasks = self.tasks_completed + self.tasks_failed
        if total_tasks == 0:
            return 100.0
        
        success_rate = self.tasks_completed / total_tasks * 100
        
        # Factor in response time (ideal < 100ms)
        response_factor = min(1.0, 100 / max(self.average_response_time_ms, 1))
        
        return success_rate * 0.8 + response_factor * 20

class RiskAnalyzerAgent(Agent):
    """Agent specialized in risk analysis."""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id, AgentType.RISK_ANALYZER, "Risk Analyzer")
    
    def execute(self, data: Dict) -> Dict:
        """Analyze building risk."""
        risk_score = (
            data.get("vibration", 0) * 0.3 +
            data.get("crack_width", 0) * 0.4 +
            data.get("building_age", 0) / 100 * 0.2 +
            data.get("current_load", 0) / 100 * 0.1
        )
        
        return {
            "agent": self.name,
            "risk_score": min(100, risk_score),
            "risk_level": "HIGH" if risk_score > 70 else "MEDIUM" if risk_score > 40 else "LOW",
            "analysis_timestamp": datetime.now().isoformat()
        }

class AnomalyDetectorAgent(Agent):
    """Agent specialized in detecting anomalies."""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id, AgentType.ANOMALY_DETECTOR, "Anomaly Detector")
        self.baseline_values = {}
    
    def execute(self, data: Dict) -> Dict:
        """Detect anomalies in data."""
        anomalies = []
        
        for key, value in data.items():
            if key in self.baseline_values:
                baseline = self.baseline_values[key]
                deviation = abs(value - baseline) / (baseline + 0.001) * 100
                
                if deviation > 30:  # 30% deviation threshold
                    anomalies.append({
                        "metric": key,
                        "value": value,
                        "baseline": baseline,
                        "deviation_percent": round(deviation, 2)
                    })
        
        return {
            "agent": self.name,
            "anomalies_detected": len(anomalies),
            "anomalies": anomalies,
            "analysis_timestamp": datetime.now().isoformat()
        }

class RecommendationEngine(Agent):
    """Agent that generates recommendations."""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id, AgentType.RECOMMENDATION_ENGINE, "Recommendation Engine")
    
    def execute(self, data: Dict) -> Dict:
        """Generate recommendations based on data."""
        recommendations = []
        
        if data.get("risk_score", 0) > 70:
            recommendations.append("URGENT: Schedule immediate structural inspection")
        
        if data.get("crack_width", 0) > 5:
            recommendations.append("Initiate crack monitoring and repair plan")
        
        if data.get("building_age", 0) > 50:
            recommendations.append("Consider retrofitting program for aging infrastructure")
        
        if data.get("current_load", 0) > 80:
            recommendations.append("Redistribute load to prevent fatigue failure")
        
        return {
            "agent": self.name,
            "recommendation_count": len(recommendations),
            "recommendations": recommendations,
            "priority": "CRITICAL" if len(recommendations) > 2 else "NORMAL",
            "analysis_timestamp": datetime.now().isoformat()
        }

class MultiAgentOrchestrator:
    """Coordinates multiple AI agents."""
    
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.execution_history = []
        self.collaboration_results = []
    
    def register_agent(self, agent: Agent):
        """Register an agent in the system."""
        self.agents[agent.agent_id] = agent
    
    def execute_agent(self, agent_id: str, data: Dict) -> Dict:
        """Execute a single agent."""
        agent = self.agents.get(agent_id)
        if not agent:
            return {"error": f"Agent {agent_id} not found"}
        
        try:
            result = agent.execute(data)
            agent.record_task_completion(0)  # TODO: measure actual time
            return result
        except Exception as e:
            agent.record_task_failure()
            return {"error": str(e), "agent": agent_id}
    
    def execute_all_agents(self, data: Dict) -> Dict:
        """Execute all agents in parallel (simulated)."""
        results = {}
        for agent_id, agent in self.agents.items():
            if agent.is_active:
                results[agent_id] = self.execute_agent(agent_id, data)
        
        self.execution_history.append({
            "timestamp": datetime.now().isoformat(),
            "agents_executed": len(results),
            "data_input": data
        })
        
        return {
            "execution_timestamp": datetime.now().isoformat(),
            "agents_executed": len(results),
            "results": results
        }
    
    def collaborate(self, data: Dict) -> Dict:
        """Execute agents and synthesize results."""
        all_results = self.execute_all_agents(data)
        
        # Synthesize results
        synthesis = {
            "overall_risk_level": "UNKNOWN",
            "consensus_confidence": 0.0,
            "critical_alerts": [],
            "recommendations": []
        }
        
        results = all_results.get("results", {})
        
        # Extract risk scores
        risk_scores = []
        for result in results.values():
            if "risk_score" in result:
                risk_scores.append(result["risk_score"])
            if "anomalies" in result and result["anomalies"]:
                synthesis["critical_alerts"].extend(result["anomalies"])
            if "recommendations" in result:
                synthesis["recommendations"].extend(result["recommendations"])
        
        if risk_scores:
            avg_risk = sum(risk_scores) / len(risk_scores)
            synthesis["overall_risk_level"] = "HIGH" if avg_risk > 70 else "MEDIUM" if avg_risk > 40 else "LOW"
            synthesis["consensus_confidence"] = min(1.0, len(risk_scores) / len(self.agents))
        
        collaboration_record = {
            "timestamp": datetime.now().isoformat(),
            "synthesis": synthesis,
            "data_analyzed": data
        }
        self.collaboration_results.append(collaboration_record)
        
        return synthesis
    
    def get_agent_status(self) -> Dict:
        """Get status of all agents."""
        status = {}
        for agent_id, agent in self.agents.items():
            status[agent_id] = {
                "name": agent.name,
                "type": agent.agent_type.value,
                "active": agent.is_active,
                "tasks_completed": agent.tasks_completed,
                "tasks_failed": agent.tasks_failed,
                "health_score": round(agent.get_health_score(), 2),
                "avg_response_time_ms": round(agent.average_response_time_ms, 2)
            }
        return status

# Global instance
orchestrator = MultiAgentOrchestrator()

# Register default agents
orchestrator.register_agent(RiskAnalyzerAgent("agent-risk-001"))
orchestrator.register_agent(AnomalyDetectorAgent("agent-anomaly-001"))
orchestrator.register_agent(RecommendationEngine("agent-rec-001"))

def analyze_with_multi_agents(building_data: Dict) -> Dict:
    """Convenience function to analyze with all agents."""
    return orchestrator.collaborate(building_data)

def get_agent_system_health() -> float:
    """Get overall health of agent system."""
    statuses = orchestrator.get_agent_status()
    if not statuses:
        return 0.0
    
    total_health = sum(status["health_score"] for status in statuses.values())
    return total_health / len(statuses)
