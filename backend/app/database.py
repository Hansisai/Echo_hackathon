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
            import json
            default_policies = [
                Policy(
                    id="congestion_pricing",
                    name="Congestion Pricing Zone",
                    description="Imposes a variable fee for driving private vehicles inside the central business district during peak hours to curb gridlock and air pollution.",
                    min_value=0.0,
                    max_value=25.0,
                    default_value=8.0,
                    unit="$",
                    purpose="To reduce peak-hour traffic gridlock and lower toxic vehicle exhaust in the city center.",
                    mechanism="Automated cameras scan license plates entering the downtown core and charge a daily toll to driver accounts.",
                    advantages=json.dumps(["Clears traffic bottlenecks for faster buses and emergency vehicles", "Generates steady municipal revenue for transit upgrades", "Improves downtown air quality"]),
                    risks=json.dumps(["Creates a financial burden for low-income commuters driving from suburbs", "May temporarily reduce downtown retail customer visits"]),
                    status="active",
                    category="Mobility & Transport"
                ),
                Policy(
                    id="metro_fare_subsidy",
                    name="Metro Fare Subsidy & Expansion",
                    description="Subsidizes public transit tickets and invests capital into building new lines to encourage shifting away from personal cars.",
                    min_value=0.0,
                    max_value=100.0,
                    default_value=30.0,
                    unit="%",
                    purpose="To make public transport affordable and accessible for all citizens while reducing private car reliance.",
                    mechanism="The city uses tax revenues to cover a portion of train and bus ticket costs while funding new track lines.",
                    advantages=json.dumps(["Direct financial savings for daily commuters", "Connects peripheral neighborhoods to job centers", "Boosts active walking to transit stations"]),
                    risks=json.dumps(["High recurring cost for the city municipal budget", "Potential crowding on popular subway lines during peak hours"]),
                    status="active",
                    category="Mobility & Equity"
                ),
                Policy(
                    id="carbon_tax",
                    name="Carbon Tax & Green Transition",
                    description="Levies a tax on corporate greenhouse gas emissions and utilizes the revenue to subsidize residential green power grids.",
                    min_value=0.0,
                    max_value=150.0,
                    default_value=40.0,
                    unit="$/ton",
                    purpose="To hold heavy polluting industries accountable and accelerate the shift toward clean renewable energy.",
                    mechanism="Factories pay a fee per ton of CO2 produced. Revenue goes directly into solar panel subsidies for homes.",
                    advantages=json.dumps(["Dramatically cuts industrial carbon pollution", "Funds clean solar and wind power installations", "Creates green energy construction jobs"]),
                    risks=json.dumps(["Short-term increase in manufacturing and utility costs", "Risk of companies passing tax costs down to consumers"]),
                    status="active",
                    category="Environment & Energy"
                ),
                Policy(
                    id="wfh_mandate",
                    name="Work From Home Incentives",
                    description="Offers corporate tax tax-cuts to businesses that mandate a minimum number of remote workdays per week to lower peak traffic flows.",
                    min_value=0.0,
                    max_value=5.0,
                    default_value=2.0,
                    unit="days/week",
                    purpose="To eliminate unnecessary daily commutes and reduce workplace energy consumption.",
                    mechanism="Companies offering flexible remote work receive corporate tax breaks proportional to telecommute days.",
                    advantages=json.dumps(["Slashes peak highway commute traffic", "Improves work-life balance and lowers employee stress", "Cuts corporate office energy consumption"]),
                    risks=json.dumps(["Lower footfall for downtown lunch cafes and retail stores", "Commercial office space vacancies"]),
                    status="active",
                    category="Economy & Work"
                ),
                Policy(
                    id="green_canopy",
                    name="Urban Green Canopy Expansion",
                    description="Funds massive tree-planting campaigns and park development across residential neighborhoods to counter the urban heat island effect.",
                    min_value=0.0,
                    max_value=50.0,
                    default_value=15.0,
                    unit="%",
                    purpose="To cool down concrete city streets and create clean, shaded neighborhood environments.",
                    mechanism="Municipal teams plant thousands of shade trees along sidewalks, bike paths, and public parks.",
                    advantages=json.dumps(["Cools summer neighborhood temperatures by up to 2°C", "Absorbs airborne dust and fine particulate pollution", "Provides psychological stress relief for residents"]),
                    risks=json.dumps(["Initial capital cost and ongoing tree watering maintenance", "Potential tree root interference with underground utility pipes"]),
                    status="active",
                    category="Health & Environment"
                ),
                # Expired Policies for Archive Filter
                Policy(
                    id="parking_subsidy_2018",
                    name="Downtown Free Parking Scheme (2018–2022)",
                    description="Offered free 2-hour municipal garage parking to boost downtown shopping footfall during retail downturns.",
                    min_value=0.0,
                    max_value=100.0,
                    default_value=100.0,
                    unit="%",
                    purpose="Designed to attract shoppers into the downtown core by eliminating parking fees.",
                    mechanism="The city covered garage maintenance fees while private vehicles parked for free.",
                    advantages=json.dumps(["Short-term increase in retail footfall", "Convenient for suburban shoppers"]),
                    risks=json.dumps(["Severely increased traffic gridlock and double parking", "Discouraged public transit usage", "High budget drain"]),
                    status="expired",
                    category="Archived Mobility"
                ),
                Policy(
                    id="fossil_bus_fleet_2015",
                    name="Diesel Bus Fleet Expansion (2015–2023)",
                    description="Expanded municipal bus coverage using standard diesel engines before zero-emission mandates.",
                    min_value=0.0,
                    max_value=100.0,
                    default_value=50.0,
                    unit="buses",
                    purpose="Rapidly expanded transit capacity at low initial capital cost.",
                    mechanism="Purchased conventional diesel transit buses to service suburban feeder routes.",
                    advantages=json.dumps(["Low initial purchase price", "Quick deployment across outer suburbs"]),
                    risks=json.dumps(["High toxic diesel particulate emissions near schools", "Phased out under clean energy transition guidelines"]),
                    status="expired",
                    category="Archived Transit"
                )
            ]
            db.add_all(default_policies)
            db.commit()
            print("Successfully seeded default and archived policies.")
            
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
