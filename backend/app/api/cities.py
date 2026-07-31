from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models import City
from backend.app.schemas import CityResponse, CityBase

router = APIRouter(prefix="/cities", tags=["Cities"])

@router.get("", response_model=List[CityResponse])
def get_cities(db: Session = Depends(get_db)):
    """
    Retrieve all default and custom city baseline profiles.
    """
    return db.query(City).all()

@router.get("/{city_id}", response_model=CityResponse)
def get_city(city_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single city's baseline parameters.
    """
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City baseline profile not found.")
    return city

@router.post("", response_model=CityResponse)
def create_city(city: CityBase, db: Session = Depends(get_db)):
    """
    Create or update a custom city profile to run simulations against.
    """
    db_city = City(
        name=city.name,
        population=city.population,
        transit_share=city.transit_share,
        avg_commute_dist=city.avg_commute_dist,
        co2_baseline=city.co2_baseline,
        aqi_baseline=city.aqi_baseline,
        median_income=city.median_income,
        health_index=city.health_index,
        municipal_budget=city.municipal_budget,
        satisfaction_baseline=city.satisfaction_baseline
    )
    db.add(db_city)
    db.commit()
    db.refresh(db_city)
    return db_city
