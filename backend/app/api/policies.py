import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models import Policy
from backend.app.schemas import PolicyResponse, PolicyGenerateRequest, PolicyParamSchema
from backend.app.agents.policy_generator import generate_policy

router = APIRouter(prefix="/policies", tags=["Policies"])

def _to_policy_response(policy: Policy) -> PolicyResponse:
    params = None
    if policy.is_ai_generated and policy.engine_config:
        try:
            config = json.loads(policy.engine_config)
            params = [PolicyParamSchema(**p) for p in config.get("params", [])]
        except Exception:
            params = None

    return PolicyResponse(
        id=policy.id,
        name=policy.name,
        description=policy.description,
        min_value=policy.min_value,
        max_value=policy.max_value,
        default_value=policy.default_value,
        unit=policy.unit,
        is_ai_generated=policy.is_ai_generated,
        params=params
    )

@router.get("", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    """
    Retrieve all policy modules available in the simulator, including any
    previously AI-generated ones.
    """
    return [_to_policy_response(p) for p in db.query(Policy).all()]

@router.post("/generate", response_model=PolicyResponse)
def generate_new_policy(payload: PolicyGenerateRequest, db: Session = Depends(get_db)):
    """
    AI Policy Search: takes a free-text description of a policy idea and auto-generates
    a fully simulate-able policy module (tunable parameters + per-sector impact coefficients),
    persisting it so it behaves exactly like a built-in policy from then on.
    """
    generated = generate_policy(payload.prompt)

    base_slug = generated["id_slug"]
    policy_id = f"ai_{base_slug}"
    # Ensure uniqueness in case of repeated/similar prompts
    if db.query(Policy).filter(Policy.id == policy_id).first():
        policy_id = f"ai_{base_slug}_{uuid.uuid4().hex[:6]}"

    primary_param = generated["params"][0]
    engine_config = {
        "params": generated["params"],
        "coefficients": generated["coefficients"],
        "impact_levers": generated.get("impact_levers", []),
    }

    db_policy = Policy(
        id=policy_id,
        name=generated["name"],
        description=generated["description"],
        min_value=float(primary_param["min"]),
        max_value=float(primary_param["max"]),
        default_value=float(primary_param["default"]),
        unit=primary_param["unit"],
        is_ai_generated=True,
        engine_config=json.dumps(engine_config)
    )

    try:
        db.add(db_policy)
        db.commit()
        db.refresh(db_policy)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save AI-generated policy: {e}")

    return _to_policy_response(db_policy)
