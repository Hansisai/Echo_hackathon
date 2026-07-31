import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models import Policy
from backend.app.schemas import PolicyResponse, PolicyDigestResponse

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.get("", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    """
    Retrieve all default policy models available in the simulator.
    """
    policies = db.query(Policy).all()
    # Parse advantages/risks json strings if needed
    for p in policies:
        if isinstance(p.advantages, str):
            try: p.advantages = json.loads(p.advantages)
            except: p.advantages = []
        if isinstance(p.risks, str):
            try: p.risks = json.loads(p.risks)
            except: p.risks = []
    return policies

@router.get("/digest", response_model=List[PolicyDigestResponse])
def get_policy_digests(
    status: Optional[str] = Query("all", description="Filter policies by status: all, active, expired"),
    db: Session = Depends(get_db)
):
    """
    Retrieve civic policy digest cards for the transparency portal with status filtering.
    """
    query = db.query(Policy)
    if status and status.lower() != "all":
        query = query.filter(Policy.status == status.lower())
    
    policies = query.all()
    digest_list = []

    for p in policies:
        adv = json.loads(p.advantages) if isinstance(p.advantages, str) and p.advantages else (p.advantages or [])
        rsk = json.loads(p.risks) if isinstance(p.risks, str) and p.risks else (p.risks or [])
        
        digest_list.append(PolicyDigestResponse(
            id=p.id,
            title=p.name,
            description=p.description,
            purpose=p.purpose or p.description,
            mechanism=p.mechanism or "Standard municipal regulatory implementation.",
            advantages=adv,
            risks=rsk,
            status=p.status,
            category=p.category
        ))

    return digest_list

