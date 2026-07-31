from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

# --- Cities ---
class CityBase(BaseModel):
    name: str
    population: int
    transit_share: float
    avg_commute_dist: float
    co2_baseline: float
    aqi_baseline: int
    median_income: float
    health_index: float
    municipal_budget: float
    satisfaction_baseline: float

class CityResponse(CityBase):
    id: int

    class Config:
        from_attributes = True

# --- Policies ---
class PolicyResponse(BaseModel):
    id: str
    name: str
    description: str
    min_value: float
    max_value: float
    default_value: float
    unit: str

    class Config:
        from_attributes = True

# --- Simulation Run ---
class SimulationRunRequest(BaseModel):
    city_id: int = Field(..., description="ID of the baseline city to simulate")
    policy_id: str = Field(..., description="ID of the policy to apply")
    parameters: Dict[str, Any] = Field(..., description="Key-value parameters (sliders) for the policy")

class AgentReportResponse(BaseModel):
    agent_name: str
    transcript: str
    score: float
    sentiment: str
    risks: List[str]
    mitigations: List[str]

class RippleNodeSchema(BaseModel):
    id: str
    label: str
    type: str
    val: float

class RippleLinkSchema(BaseModel):
    source: str
    target: str

class RippleGraphSchema(BaseModel):
    nodes: List[RippleNodeSchema]
    links: List[RippleLinkSchema]

class SimulationRunResponse(BaseModel):
    simulation_id: str
    city_name: str
    policy_name: str
    parameters: Dict[str, Any]
    run_date: datetime
    final_scores: Dict[str, float]
    projections: List[Dict[str, Any]]
    agent_reports: List[AgentReportResponse]
    ripple_graph: RippleGraphSchema

# --- History ---
class SimulationHistoryItem(BaseModel):
    id: str
    city_name: str
    policy_name: str
    run_date: datetime
    final_scores: Dict[str, float]

    class Config:
        from_attributes = True
