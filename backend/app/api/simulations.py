import json
import uuid
import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models import City, Policy, SimulationRun, AgentReport
from backend.app.engine.policy_engine import calculate_simulation, calculate_generic_simulation
from backend.app.agents.manager import run_all_agents
from backend.app.schemas import (
    SimulationRunRequest, 
    SimulationRunResponse, 
    SimulationHistoryItem,
    AgentReportResponse
)

router = APIRouter(prefix="/simulations", tags=["Simulations"])

@router.post("/run", response_model=SimulationRunResponse)
def run_simulation(payload: SimulationRunRequest, db: Session = Depends(get_db)):
    """
    Triggers a multi-agent policy simulation:
    1. Fetches city and policy data.
    2. Runs quantitative math calculations.
    3. Runs AI agent deliberation in parallel (Gemini or high-quality mock fallback).
    4. Persists execution to SQLite.
    5. Returns full synthesis.
    """
    # 1. Fetch baseline assets
    city = db.query(City).filter(City.id == payload.city_id).first()
    policy = db.query(Policy).filter(Policy.id == payload.policy_id).first()
    
    if not city:
        raise HTTPException(status_code=404, detail="Selected city baseline profile not found.")
    if not policy:
        raise HTTPException(status_code=404, detail="Selected policy module not found.")

    # Convert city data model to dict
    city_dict = {
        "id": city.id,
        "name": city.name,
        "population": city.population,
        "transit_share": city.transit_share,
        "avg_commute_dist": city.avg_commute_dist,
        "co2_baseline": city.co2_baseline,
        "aqi_baseline": city.aqi_baseline,
        "median_income": city.median_income,
        "health_index": city.health_index,
        "municipal_budget": city.municipal_budget,
        "satisfaction_baseline": city.satisfaction_baseline
    }

    # 2. Execute mathematical engine (deltas, projections, causal graph)
    if policy.is_ai_generated and policy.engine_config:
        engine_config = json.loads(policy.engine_config)
        engine_results = calculate_generic_simulation(city_dict, policy.name, engine_config, payload.parameters)
    else:
        engine_results = calculate_simulation(city_dict, policy.id, payload.parameters)

    # 3. Deliberate among AI agents (calling Gemini in parallel, or using mock fallbacks)
    agent_outputs = run_all_agents(
        city_name=city.name,
        city_stats=city_dict,
        policy_id=policy.id,
        policy_name=policy.name,
        parameters=payload.parameters,
        engine_results=engine_results
    )

    # Generate unique run ID
    run_id = f"sim_{uuid.uuid4().hex[:8]}"
    run_date = datetime.utcnow()

    # 4. Save to Database
    db_run = SimulationRun(
        id=run_id,
        city_id=city.id,
        policy_id=policy.id,
        parameters=json.dumps(payload.parameters),
        run_date=run_date,
        final_scores=json.dumps(engine_results["final_scores"]),
        projections=json.dumps(engine_results["projections"]),
        ripple_graph=json.dumps(engine_results["ripple_graph"])
    )
    db.add(db_run)

    db_reports = []
    for out in agent_outputs:
        report_row = AgentReport(
            run_id=run_id,
            agent_name=out["agent_name"],
            transcript=out["transcript"],
            score=out["score"],
            sentiment=out["sentiment"]
        )
        db_reports.append(report_row)
        db.add(report_row)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {e}")

    # 5. Assemble response matching SimulationRunResponse
    return SimulationRunResponse(
        simulation_id=run_id,
        city_name=city.name,
        policy_name=policy.name,
        parameters=payload.parameters,
        run_date=run_date,
        final_scores=engine_results["final_scores"],
        projections=engine_results["projections"],
        agent_reports=[
            AgentReportResponse(
                agent_name=out["agent_name"],
                transcript=out["transcript"],
                score=out["score"],
                sentiment=out["sentiment"],
                risks=out["risks"],
                mitigations=out["mitigations"]
            )
            for out in agent_outputs
        ],
        ripple_graph=engine_results["ripple_graph"]
    )

@router.get("/history", response_model=List[SimulationHistoryItem])
def get_history(db: Session = Depends(get_db)):
    """
    Retrieve logs of past policy simulation runs.
    """
    runs = db.query(SimulationRun).order_by(SimulationRun.run_date.desc()).all()
    history = []
    for r in runs:
        history.append(SimulationHistoryItem(
            id=r.id,
            city_name=r.city.name,
            policy_name=r.policy.name,
            run_date=r.run_date,
            final_scores=json.loads(r.final_scores)
        ))
    return history

@router.get("/{run_id}", response_model=SimulationRunResponse)
def get_simulation_run(run_id: str, db: Session = Depends(get_db)):
    """
    Retrieve detail report for a single saved simulation run.
    """
    run = db.query(SimulationRun).filter(SimulationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    # Reconstruct risks/mitigations depending on policy and agent (similar to manager fallbacks)
    # The database saves the core attributes, and we map the standard lists back to it
    risks_data = {
        "economy": ["Localized business cost increases", "Risk of retail drop in downtown cores", "Capital expenditure strain"],
        "transport": ["Transit capacity bottlenecks at peak hours", "Revenue shortfall if vehicle usage drops too fast", "Deferred highway upgrades"],
        "environment": ["Potential displacement of emissions to outer bounds", "Increased demand on electrical grids", "Eco-system monitoring overhead"],
        "healthcare": ["Increased pedestrian density in transit hubs", "Sedentary concerns if working in isolations", "Unequal distribution of clean-air zones"],
        "citizen": ["Regressive cost structures on low-income groups", "Unequal distribution of policy benefits", "Displacement of outer-ring commuters"],
        "infrastructure": ["Utility root damage risks", "Grid load spikes in residential sectors", "Capital installation cost barriers"]
    }
    
    mitigations_data = {
        "economy": ["Provide tax offsets for inner-city retailers", "Reinvest tax revenue into utility subsidies", "Phase implementation slowly"],
        "transport": ["Increase bus transit frequencies immediately", "Optimize traffic lights on transit corridors", "Create suburban park-and-rides"],
        "environment": ["Incentivize local cargo deliveries to use EVs", "Expand green grid storage capacity", "Audit emissions regularly"],
        "healthcare": ["Develop walkability paths along transit lines", "Promote ergonomic remote work guidelines", "Install air quality monitors near schools"],
        "citizen": ["Implement income-based charge exemptions", "Subsidize outer zone bus links", "Host neighborhood policy assemblies"],
        "infrastructure": ["Coordinate root barrier guidelines with forestry", "Upgrade residential power substation nodes", "Install smart meter trackers"]
    }

    reports_list = []
    for r in run.reports:
        reports_list.append(AgentReportResponse(
            agent_name=r.agent_name,
            transcript=r.transcript,
            score=r.score,
            sentiment=r.sentiment,
            risks=risks_data.get(r.agent_name, []),
            mitigations=mitigations_data.get(r.agent_name, [])
        ))

    return SimulationRunResponse(
        simulation_id=run.id,
        city_name=run.city.name,
        policy_name=run.policy.name,
        parameters=json.loads(run.parameters),
        run_date=run.run_date,
        final_scores=json.loads(run.final_scores),
        projections=json.loads(run.projections),
        agent_reports=reports_list,
        ripple_graph=json.loads(run.ripple_graph)
    )

@router.delete("/{run_id}")
def delete_simulation_run(run_id: str, db: Session = Depends(get_db)):
    """
    Remove a saved simulation run.
    """
    run = db.query(SimulationRun).filter(SimulationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")
    db.delete(run)
    db.commit()
    return {"status": "success", "message": f"Simulation run {run_id} deleted."}

@router.get("/{run_id}/export")
def export_simulation(run_id: str, format: str = "json", db: Session = Depends(get_db)):
    """
    Exports the simulation report in multiple formats (JSON, TXT, CSV).
    """
    run = db.query(SimulationRun).filter(SimulationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")
    
    params = json.loads(run.parameters)
    scores = json.loads(run.final_scores)
    projections = json.loads(run.projections)
    
    if format == "html":
        # Calculate overall score and grade
        avg_score = round(sum(scores.values()) / len(scores), 1)
        letter_grade = 'C'
        if avg_score >= 95: letter_grade = 'A+'
        elif avg_score >= 90: letter_grade = 'A'
        elif avg_score >= 85: letter_grade = 'A-'
        elif avg_score >= 80: letter_grade = 'B+'
        elif avg_score >= 75: letter_grade = 'B'
        elif avg_score >= 70: letter_grade = 'B-'
        elif avg_score >= 65: letter_grade = 'C+'
        elif avg_score >= 60: letter_grade = 'C'
        elif avg_score >= 50: letter_grade = 'D'
        else: letter_grade = 'F'
        
        # Color mapping helper
        def get_agent_color(name):
            colors = {
                "economy": "#f59e0b",
                "environment": "#10b981",
                "mobility": "#06b6d4",
                "equity": "#f43f5e",
                "health": "#14b8a6",
                "infrastructure": "#a78bfa"
            }
            return colors.get(name.lower(), "#8b5cf6")

        # HTML generation
        agent_cards_html = ""
        for rep in run.reports:
            color = get_agent_color(rep.agent_name)
            agent_cards_html += f"""
            <div class="agent-card">
                <div class="agent-header">
                    <span class="agent-name" style="color: {color};">{rep.agent_name.title()} Advisor</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="score-badge" style="border: 1px solid {color}44; color: {color}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Score: {rep.score}/100</span>
                        <span class="sentiment-badge {rep.sentiment.lower()}">{rep.sentiment}</span>
                    </div>
                </div>
                <div class="agent-statement">
                    "{rep.transcript}"
                </div>
            </div>
            """

        params_html = "".join([f"<li><strong>{k.replace('_', ' ').title()}:</strong> {v}</li>" for k, v in params.items()])
        
        score_boxes_html = ""
        for k, v in scores.items():
            color = get_agent_color(k)
            score_boxes_html += f"""
            <div class="score-box" style="border-top: 3px solid {color};">
                <h4 style="color: {color};">{k.title()}</h4>
                <div class="score-val">{v}<span style="font-size: 12px; color: #9ca3af;">/100</span></div>
            </div>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simulation Executive Report - {run.city.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {{
            font-family: 'Inter', sans-serif;
            background: #090a0f;
            color: #d1d5db;
            padding: 40px 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
        }}
        .header {{
            border-left: 4px solid #8b5cf6;
            padding-left: 20px;
            margin-bottom: 40px;
        }}
        h1 {{
            color: #ffffff;
            font-size: 26px;
            margin: 0 0 8px 0;
            font-weight: 800;
        }}
        .report-subtitle {{
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
        }}
        .meta-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}
        .card {{
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 20px;
        }}
        .card h3 {{
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #ffffff;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .card ul {{
            margin: 0;
            padding-left: 20px;
        }}
        .card li {{
            margin-bottom: 6px;
            font-size: 13px;
        }}
        .score-section {{
            background: rgba(139, 92, 246, 0.04);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 35px;
        }}
        .score-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(139, 92, 246, 0.15);
            padding-bottom: 12px;
        }}
        .score-header-title {{
            font-weight: 700;
            color: #ffffff;
            font-size: 16px;
        }}
        .grade-badge {{
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 13px;
        }}
        .score-grid {{
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
        }}
        .score-box {{
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 12px 8px;
            text-align: center;
        }}
        .score-box h4 {{
            margin: 0 0 6px 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .score-val {{
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
        }}
        .agent-card {{
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 16px;
        }}
        .agent-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }}
        .agent-name {{
            font-weight: 700;
            font-size: 14px;
        }}
        .agent-statement {{
            font-style: italic;
            font-size: 13px;
            color: #e5e7eb;
        }}
        .sentiment-badge {{
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .positive {{ background: rgba(16, 185, 129, 0.15); color: #10b981; }}
        .negative {{ background: rgba(244, 63, 94, 0.15); color: #f43f5e; }}
        .neutral {{ background: rgba(6, 182, 212, 0.15); color: #06b6d4; }}
    </style>
</head>
<body>
    <div class="header">
        <span class="report-subtitle">Living Policy Simulator Executive Report</span>
        <h1>{run.policy.name}</h1>
        <div style="font-size: 12px; color: #9ca3af;">Applied to <strong>{run.city.name}</strong> • ID: {run.id} • {run.run_date.strftime('%Y-%m-%d %H:%M')}</div>
    </div>

    <div class="meta-grid">
        <div class="card">
            <h3>Applied Sliders</h3>
            <ul>
                {params_html}
            </ul>
        </div>
        <div class="card">
            <h3>City Context</h3>
            <ul>
                <li><strong>Population:</strong> {run.city.population:,}</li>
                <li><strong>Public Transit Share:</strong> {run.city.transit_share}%</li>
                <li><strong>Avg Commute Distance:</strong> {run.city.avg_commute_dist} km</li>
                <li><strong>Baseline Smog (AQI):</strong> {run.city.aqi_baseline}</li>
            </ul>
        </div>
    </div>

    <div class="score-section">
        <div class="score-header">
            <span class="score-header-title">Simulation Summary Outcomes</span>
            <span class="grade-badge" style="background-color: {'#10b981' if letter_grade.startswith('A') else '#06b6d4' if letter_grade.startswith('B') else '#f59e0b' if letter_grade.startswith('C') else '#f43f5e'};">Grade: {letter_grade} ({avg_score}%)</span>
        </div>
        <div class="score-grid">
            {score_boxes_html}
        </div>
    </div>

    <h2 style="font-size: 16px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; font-weight: 700;">Specialized Virtual AI Advisors Deliberations</h2>
    {agent_cards_html}
</body>
</html>"""
        headers = {"Content-Disposition": f"attachment; filename=living_policy_report_{run_id}.html"}
        return Response(content=html_content, media_type="text/html", headers=headers)
        
    elif format == "csv":
        # Generate a CSV of the 5-year projections
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(["Year", "Economy", "Environment", "Mobility", "Equity", "Health"])
        for p in projections:
            writer.writerow([
                p.get("year"),
                p.get("economy"),
                p.get("environment"),
                p.get("mobility"),
                p.get("equity"),
                p.get("health")
            ])
            
        csv_data = output.getvalue()
        headers = {"Content-Disposition": f"attachment; filename=living_policy_projections_{run_id}.csv"}
        return Response(content=csv_data, media_type="text/csv", headers=headers)
        
    else:
        # Default JSON format
        export_data = {
            "report_id": run.id,
            "generated_at": run.run_date.isoformat(),
            "metadata": {
                "city": run.city.name,
                "policy": run.policy.name,
                "applied_parameters": params
            },
            "scores": scores,
            "timeline_projections": projections,
            "deliberations": [
                {
                    "agent": rep.agent_name,
                    "statement": rep.transcript,
                    "score": rep.score,
                    "sentiment": rep.sentiment
                }
                for rep in run.reports
            ]
        }
        headers = {"Content-Disposition": f"attachment; filename=living_policy_report_{run_id}.json"}
        return JSONResponse(content=export_data, headers=headers)
