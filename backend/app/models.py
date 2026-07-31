from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    population = Column(Integer, nullable=False)
    transit_share = Column(Float, nullable=False)  # e.g., 55.0 for 55%
    avg_commute_dist = Column(Float, nullable=False)  # in km
    co2_baseline = Column(Float, nullable=False)  # tons/capita/year
    aqi_baseline = Column(Integer, nullable=False)  # AQI index (0-500)
    median_income = Column(Float, nullable=False)  # $/year
    health_index = Column(Float, nullable=False)  # 0-100 score
    municipal_budget = Column(Float, nullable=False)  # Million $
    satisfaction_baseline = Column(Float, nullable=False)  # 0-100 score

    runs = relationship("SimulationRun", back_populates="city")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    min_value = Column(Float, nullable=False)
    max_value = Column(Float, nullable=False)
    default_value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)

    runs = relationship("SimulationRun", back_populates="policy")


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(50), primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    policy_id = Column(String(50), ForeignKey("policies.id"), nullable=False)
    parameters = Column(Text, nullable=False)  # JSON string of applied parameters
    run_date = Column(DateTime, nullable=False)
    final_scores = Column(Text, nullable=False)  # JSON string: {economy: x, environment: y, ...}
    projections = Column(Text, nullable=False)  # JSON string of yearly metrics array
    ripple_graph = Column(Text, nullable=False)  # JSON string of graph node-link schema

    city = relationship("City", back_populates="runs")
    policy = relationship("Policy", back_populates="runs")
    reports = relationship("AgentReport", back_populates="run", cascade="all, delete-orphan")


class AgentReport(Base):
    __tablename__ = "agent_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(String(50), ForeignKey("simulation_runs.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String(50), nullable=False)  # e.g., 'economy', 'environment'
    transcript = Column(Text, nullable=False)
    score = Column(Float, nullable=False)  # 0-100 rating
    sentiment = Column(String(20), nullable=False)  # positive, negative, neutral

    run = relationship("SimulationRun", back_populates="reports")
