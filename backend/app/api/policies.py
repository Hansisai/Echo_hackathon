from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models import Policy
from backend.app.schemas import PolicyResponse

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.get("", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    """
    Retrieve all default policy models available in the simulator.
    """
    return db.query(Policy).all()
