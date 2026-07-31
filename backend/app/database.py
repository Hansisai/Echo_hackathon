import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models import Base, City, Policy

# Ensure the database file is placed in the backend directory
DATABASE_URL = "sqlite:///./database.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Needed for SQLite in multi-threaded FastAPI apps
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if we need to seed cities
        if db.query(City).count() == 0:
            default_cities = [
                City(
                    id=1,
                    name="Metropolis Prime",
                    population=8500000,
                    transit_share=55.0,
                    avg_commute_dist=12.5,
                    co2_baseline=4.2,
                    aqi_baseline=65,
                    median_income=62000.0,
                    health_index=78.0,
                    municipal_budget=4500.0,
                    satisfaction_baseline=72.0
                ),
                City(
                    id=2,
                    name="Automopolis",
                    population=3200000,
                    transit_share=10.0,
                    avg_commute_dist=24.0,
                    co2_baseline=11.8,
                    aqi_baseline=135,
                    median_income=58000.0,
                    health_index=55.0,
                    municipal_budget=1800.0,
                    satisfaction_baseline=50.0
                ),
                City(
                    id=3,
                    name="Industria",
                    population=4800000,
                    transit_share=25.0,
                    avg_commute_dist=15.0,
                    co2_baseline=14.5,
                    aqi_baseline=165,
                    median_income=42000.0,
                    health_index=48.0,
                    municipal_budget=2200.0,
                    satisfaction_baseline=45.0
                ),
                City(
                    id=4,
                    name="Equitopia",
                    population=1200000,
                    transit_share=35.0,
                    avg_commute_dist=6.2,
                    co2_baseline=2.1,
                    aqi_baseline=38,
                    median_income=68000.0,
                    health_index=88.0,
                    municipal_budget=950.0,
                    satisfaction_baseline=85.0
                )
            ]
            db.add_all(default_cities)
            db.commit()
            print("Successfully seeded default cities.")

        # Check if we need to seed policies
        if db.query(Policy).count() == 0:
            default_policies = [
                Policy(
                    id="congestion_pricing",
                    name="Congestion Pricing Zone",
                    description="Imposes a variable fee for driving private vehicles inside the central business district during peak hours to curb gridlock and air pollution.",
                    min_value=0.0,
                    max_value=25.0,
                    default_value=8.0,
                    unit="$"
                ),
                Policy(
                    id="metro_fare_subsidy",
                    name="Metro Fare Subsidy & Expansion",
                    description="Subsidizes public transit tickets and invests capital into building new lines to encourage shifting away from personal cars.",
                    min_value=0.0,
                    max_value=100.0,
                    default_value=30.0,
                    unit="%"
                ),
                Policy(
                    id="carbon_tax",
                    name="Carbon Tax & Green Transition",
                    description="Levies a tax on corporate greenhouse gas emissions and utilizes the revenue to subsidize residential green power grids.",
                    min_value=0.0,
                    max_value=150.0,
                    default_value=40.0,
                    unit="$/ton"
                ),
                Policy(
                    id="wfh_mandate",
                    name="Work From Home Incentives",
                    description="Offers corporate tax tax-cuts to businesses that mandate a minimum number of remote workdays per week to lower peak traffic flows.",
                    min_value=0.0,
                    max_value=5.0,
                    default_value=2.0,
                    unit="days/week"
                ),
                Policy(
                    id="green_canopy",
                    name="Urban Green Canopy Expansion",
                    description="Funds massive tree-planting campaigns and park development across residential neighborhoods to counter the urban heat island effect.",
                    min_value=0.0,
                    max_value=50.0,
                    default_value=15.0,
                    unit="%"
                )
            ]
            db.add_all(default_policies)
            db.commit()
            print("Successfully seeded default policies.")
            
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
