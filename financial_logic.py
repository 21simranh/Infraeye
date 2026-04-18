"""
Financial Logic - Reward Calculation System
Calculates rewards, incentives, and financial metrics for infrastructure monitoring
"""

from typing import Dict, Tuple
from enum import Enum
from datetime import datetime

class RewardType(Enum):
    """Types of rewards for monitoring activities."""
    INCIDENT_PREVENTION = "INCIDENT_PREVENTION"
    DATA_CONTRIBUTION = "DATA_CONTRIBUTION"
    EARLY_DETECTION = "EARLY_DETECTION"
    MAINTENANCE_COMPLETION = "MAINTENANCE_COMPLETION"
    SYSTEM_IMPROVEMENT = "SYSTEM_IMPROVEMENT"
    ACCURACY_BONUS = "ACCURACY_BONUS"

class FinancialLogic:
    """Manages reward calculations and financial metrics."""
    
    def __init__(self):
        self.reward_rates = {
            RewardType.INCIDENT_PREVENTION: 100.0,      # Per incident prevented
            RewardType.DATA_CONTRIBUTION: 0.5,           # Per data point
            RewardType.EARLY_DETECTION: 150.0,           # Per early detection
            RewardType.MAINTENANCE_COMPLETION: 75.0,     # Per maintenance task
            RewardType.SYSTEM_IMPROVEMENT: 200.0,        # Per improvement
            RewardType.ACCURACY_BONUS: 50.0              # For high accuracy
        }
        
        self.total_rewards_paid = 0.0
        self.reward_history = []
    
    def calculate_incident_prevention_reward(self, 
                                           risk_score_before: float, 
                                           risk_score_after: float,
                                           building_value: float = 1000000.0) -> float:
        """
        Calculate reward for preventing an incident.
        
        Args:
            risk_score_before: Risk score before intervention (0-100)
            risk_score_after: Risk score after intervention (0-100)
            building_value: Estimated building value
        
        Returns:
            Reward amount
        """
        # Risk reduction as percentage
        risk_reduction = (risk_score_before - risk_score_after) / 100.0
        
        # Calculate potential damage avoided
        potential_damage = building_value * (risk_score_before / 100.0) * 0.1
        damage_avoided = potential_damage * risk_reduction
        
        # Reward is 0.01% of damage avoided, minimum base rate
        reward = max(
            self.reward_rates[RewardType.INCIDENT_PREVENTION],
            damage_avoided * 0.0001
        )
        
        return reward
    
    def calculate_data_contribution_reward(self, 
                                          data_points: int,
                                          data_quality: float = 1.0) -> float:
        """
        Calculate reward for contributing data.
        
        Args:
            data_points: Number of data points contributed
            data_quality: Quality multiplier (0.5-2.0)
        
        Returns:
            Reward amount
        """
        base_reward = data_points * self.reward_rates[RewardType.DATA_CONTRIBUTION]
        return base_reward * data_quality
    
    def calculate_early_detection_reward(self, 
                                        days_early: int,
                                        risk_averted: float) -> float:
        """
        Calculate reward for early issue detection.
        
        Args:
            days_early: How many days earlier than expected
            risk_averted: Percentage of risk averted (0-100)
        
        Returns:
            Reward amount
        """
        base_reward = self.reward_rates[RewardType.EARLY_DETECTION]
        
        # Bonus for earlier detection (5% per day, max 100%)
        time_bonus = min(1.0, days_early * 0.05)
        
        # Risk factor (higher risk = higher reward)
        risk_factor = risk_averted / 100.0
        
        return base_reward * (1 + time_bonus) * (1 + risk_factor)
    
    def calculate_accuracy_bonus(self, prediction_accuracy: float) -> float:
        """
        Calculate accuracy bonus.
        
        Args:
            prediction_accuracy: Accuracy percentage (0-100)
        
        Returns:
            Bonus amount
        """
        if prediction_accuracy < 50:
            return 0
        
        # No bonus below 50%, scales from 0 to 200% at 100% accuracy
        multiplier = (prediction_accuracy - 50) / 50.0
        return self.reward_rates[RewardType.ACCURACY_BONUS] * multiplier
    
    def calculate_maintenance_completion_reward(self, 
                                               completion_time_hours: float,
                                               target_time_hours: float,
                                               buildings_maintained: int) -> float:
        """
        Calculate reward for maintenance tasks.
        
        Args:
            completion_time_hours: Actual time to complete
            target_time_hours: Target completion time
            buildings_maintained: Number of buildings serviced
        
        Returns:
            Reward amount
        """
        base_reward = self.reward_rates[RewardType.MAINTENANCE_COMPLETION] * buildings_maintained
        
        # Efficiency bonus if completed before target time
        if completion_time_hours < target_time_hours:
            efficiency = 1 + (target_time_hours - completion_time_hours) / target_time_hours * 0.5
            return base_reward * efficiency
        
        return base_reward
    
    def calculate_system_improvement_reward(self, 
                                           improvement_metric: str,
                                           improvement_percentage: float) -> float:
        """
        Calculate reward for system improvements.
        
        Args:
            improvement_metric: What was improved (e.g., 'accuracy', 'response_time')
            improvement_percentage: Percentage improvement
        
        Returns:
            Reward amount
        """
        base_reward = self.reward_rates[RewardType.SYSTEM_IMPROVEMENT]
        
        # Scale with improvement percentage (capped at 300%)
        improvement_multiplier = min(3.0, improvement_percentage / 100.0)
        
        return base_reward * improvement_multiplier
    
    def process_reward(self, reward_type: RewardType, amount: float, details: Dict = None) -> Dict:
        """
        Process and record a reward.
        
        Args:
            reward_type: Type of reward
            amount: Reward amount
            details: Additional details about the reward
        
        Returns:
            Reward record
        """
        reward_record = {
            "timestamp": datetime.now().isoformat(),
            "reward_type": reward_type.value,
            "amount": round(amount, 2),
            "details": details or {}
        }
        
        self.reward_history.append(reward_record)
        self.total_rewards_paid += amount
        
        return reward_record
    
    def calculate_total_value_created(self, 
                                      incidents_prevented: int,
                                      avg_incident_cost: float = 50000.0) -> float:
        """
        Calculate total economic value created.
        
        Args:
            incidents_prevented: Number of incidents prevented
            avg_incident_cost: Average cost per incident
        
        Returns:
            Total value in currency
        """
        incident_value = incidents_prevented * avg_incident_cost
        reward_efficiency = incident_value / self.total_rewards_paid if self.total_rewards_paid > 0 else 0
        
        return {
            "incident_value_prevented": incident_value,
            "total_rewards_distributed": self.total_rewards_paid,
            "roi": round(incident_value / self.total_rewards_paid, 2) if self.total_rewards_paid > 0 else 0,
            "average_value_per_reward": round(incident_value / len(self.reward_history), 2) if self.reward_history else 0
        }
    
    def get_leaderboard(self, limit: int = 10) -> Dict:
        """Get top reward earners (mock data)."""
        return {
            "top_earners": [
                {"rank": i+1, "user_id": f"USER-{i}", "total_rewards": 10000 * (limit - i)} 
                for i in range(min(limit, 10))
            ]
        }

# Global instance
financial_logic = FinancialLogic()

def reward_incident_prevention(risk_before: float, risk_after: float) -> Dict:
    """Convenience function to reward incident prevention."""
    reward = financial_logic.calculate_incident_prevention_reward(risk_before, risk_after)
    return financial_logic.process_reward(
        RewardType.INCIDENT_PREVENTION, 
        reward,
        {"risk_before": risk_before, "risk_after": risk_after}
    )

def get_total_rewards_paid() -> float:
    """Get total rewards paid out."""
    return financial_logic.total_rewards_paid

def get_roi_metrics() -> Dict:
    """Get return on investment metrics."""
    return financial_logic.calculate_total_value_created(
        incidents_prevented=financial_logic.total_rewards_paid / 100  # Estimate
    )
