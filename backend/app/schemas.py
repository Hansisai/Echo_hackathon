from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
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
    purpose: Optional[str] = None
    mechanism: Optional[str] = None
    advantages: List[str] = []
    risks: List[str] = []
    status: str = "active"
    category: str = "Urban Planning"

    class Config:
        from_attributes = True

class PolicyDigestResponse(BaseModel):
    id: str
    title: str
    description: str
    purpose: str
    mechanism: str
    advantages: List[str]
    risks: List[str]
    status: str
    category: str

# --- Graph & Agent Schemas ---
class AgentReportResponse(BaseModel):
    agent_name: str
    transcript: str
    score: float
    sentiment: str
    risks: List[str]
    mitigations: List[str]
    decision: Optional[str] = None
    confidence_score: Optional[float] = None
    justification: Optional[str] = None
    alternative_pathways: Optional[List[str]] = None

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

# --- Policy Bundling ---
class PolicyBundleItem(BaseModel):
    policy_id: str
    parameters: Dict[str, Any]

class BundledSimulationRunRequest(BaseModel):
    city_id: int
    bundles: List[PolicyBundleItem] = Field(..., min_items=2, description="At least two policies to bundle")

class SynergyConflictItem(BaseModel):
    type: str  # "synergy" or "conflict"
    title: str
    description: str
    affected_sectors: List[str]
    magnitude: float  # score delta effect

class BundledSimulationRunResponse(BaseModel):
    simulation_id: str
    city_name: str
    bundled_policies: List[str]
    all_parameters: Dict[str, Any]
    run_date: datetime
    final_scores: Dict[str, float]
    baseline_scores: Dict[str, float]
    single_policy_benchmarks: Dict[str, Dict[str, float]]
    synergies_and_conflicts: List[SynergyConflictItem]
    projections: List[Dict[str, Any]]
    agent_reports: List[AgentReportResponse]
    ripple_graph: RippleGraphSchema

# --- Simulation Run ---
class SimulationRunRequest(BaseModel):
    city_id: int = Field(..., description="ID of the baseline city to simulate")
    policy_id: str = Field(..., description="ID of the policy to apply")
    parameters: Dict[str, Any] = Field(..., description="Key-value parameters (sliders) for the policy")

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
