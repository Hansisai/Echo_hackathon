import json
import math

def _compute_base_scores(city_data: dict) -> dict:
    """
    Establishes base index values (0-100 scale) for the 5 sectors from raw city data.
    Shared by both the hardcoded built-in policies and the generic AI-generated policy engine.
    """
    transit = city_data.get("transit_share", 20.0)
    commute = city_data.get("avg_commute_dist", 15.0)
    co2 = city_data.get("co2_baseline", 8.0)
    aqi = city_data.get("aqi_baseline", 100)
    income = city_data.get("median_income", 50000.0)
    health = city_data.get("health_index", 60.0)
    budget = city_data.get("municipal_budget", 1000.0)
    satisfaction = city_data.get("satisfaction_baseline", 50.0)

    base_economy = min(100.0, max(10.0, (income / 80000.0) * 50 + (budget / 5000.0) * 30))
    base_environment = min(100.0, max(10.0, (1 - (co2 / 20.0)) * 40 + (1 - (aqi / 300.0)) * 40))
    base_mobility = min(100.0, max(10.0, transit * 0.8 + (1 - (commute / 30.0)) * 30))
    base_equity = min(100.0, max(10.0, (income / 80000.0) * 30 + transit * 0.5 + satisfaction * 0.2))
    base_health = health

    return {
        "economy": round(base_economy, 1),
        "environment": round(base_environment, 1),
        "mobility": round(base_mobility, 1),
        "equity": round(base_equity, 1),
        "health": round(base_health, 1)
    }

def _build_projections(base_scores: dict, deltas: dict) -> list:
    """Generates the shared 6-point (year 0-5) projection timeline from base scores + linear deltas."""
    projections = []
    for year in range(6):
        coef = year / 5.0
        fluct_eco = math.sin(year * 1.2) * 0.6
        fluct_env = math.cos(year * 0.9) * 0.5

        projections.append({
            "year": year,
            "economy": round(min(95.0, max(10.0, base_scores["economy"] + (deltas["economy"] * coef) + fluct_eco)), 1),
            "environment": round(min(95.0, max(10.0, base_scores["environment"] + (deltas["environment"] * coef) + fluct_env)), 1),
            "mobility": round(min(95.0, max(10.0, base_scores["mobility"] + (deltas["mobility"] * coef))), 1),
            "equity": round(min(95.0, max(10.0, base_scores["equity"] + (deltas["equity"] * coef))), 1),
            "health": round(min(95.0, max(10.0, base_scores["health"] + (deltas["health"] * coef))), 1),
        })
    return projections

def calculate_simulation(city_data: dict, policy_id: str, parameters: dict) -> dict:
    """
    Executes the quantitative policy simulation engine.
    Returns:
        - final_scores: Dict of 5-year end scores for 5 sectors (0-100)
        - projections: 5-year yearly timeline of metrics
        - ripple_graph: Node-link schema for causal flow visualization
    """
    # 1. Establish base index values (0-100 scale) from city data
    base_scores = _compute_base_scores(city_data)

    # 2. Apply policy sliders coefficients
    deltas = {"economy": 0.0, "environment": 0.0, "mobility": 0.0, "equity": 0.0, "health": 0.0}
    nodes = []
    links = []

    if policy_id == "congestion_pricing":
        fee = float(parameters.get("fee", 8.0))
        # Math deltas
        deltas["economy"] = 0.1 * fee
        deltas["environment"] = 0.4 * fee
        deltas["mobility"] = 0.5 * fee
        deltas["equity"] = -0.4 * fee
        deltas["health"] = 0.3 * fee

        # Custom nodes for Congestion Pricing
        nodes = [
            {"id": "p_origin", "label": f"Congestion Charge: ${fee}/day", "type": "origin", "val": fee},
            {"id": "n_traffic", "label": f"Private Cars: -{round(fee * 2.5, 1)}%", "type": "positive", "val": -fee * 2.5},
            {"id": "n_transit", "label": f"Transit Riders: +{round(fee * 1.8, 1)}%", "type": "positive", "val": fee * 1.8},
            {"id": "n_revenue", "label": f"Municipal Revenue: +${round(fee * 2.2, 1)}M/yr", "type": "positive", "val": fee * 2.2},
            {"id": "n_cost", "label": f"Commute Cost: +${round(fee * 200, 0)}/yr", "type": "negative", "val": -fee * 200},
            {"id": "n_aqi", "label": f"Air Pollution (PM2.5): -{round(fee * 2.0, 1)}%", "type": "positive", "val": -fee * 2.0},
            {"id": "n_respiratory", "label": f"Asthma Admissions: -{round(fee * 1.2, 1)}%", "type": "positive", "val": -fee * 1.2},
            {"id": "n_disposable", "label": "Low-Income Disposable Income: -4.5%", "type": "negative", "val": -4.5},
            {"id": "n_retail", "label": "Downtown Retail Footfall: -3.2%", "type": "negative", "val": -3.2}
        ]
        links = [
            {"source": "p_origin", "target": "n_traffic"},
            {"source": "p_origin", "target": "n_transit"},
            {"source": "p_origin", "target": "n_revenue"},
            {"source": "p_origin", "target": "n_cost"},
            {"source": "n_traffic", "target": "n_aqi"},
            {"source": "n_traffic", "target": "n_retail"},
            {"source": "n_aqi", "target": "n_respiratory"},
            {"source": "n_cost", "target": "n_disposable"}
        ]

    elif policy_id == "metro_fare_subsidy":
        subsidy = float(parameters.get("subsidy_level", 30.0))
        budget_m = float(parameters.get("expansion_budget_m", 15.0))

        # Math deltas
        deltas["economy"] = -0.05 * subsidy + 0.15 * budget_m
        deltas["environment"] = 0.1 * subsidy + 0.15 * budget_m
        deltas["mobility"] = 0.12 * subsidy + 0.25 * budget_m
        deltas["equity"] = 0.15 * subsidy + 0.1 * budget_m
        deltas["health"] = 0.08 * subsidy + 0.08 * budget_m

        nodes = [
            {"id": "p_origin", "label": f"Transit Subsidy {subsidy}% & Expansion", "type": "origin", "val": subsidy},
            {"id": "n_ridership", "label": f"Metro Ridership: +{round(subsidy * 0.4 + budget_m * 0.8, 1)}%", "type": "positive", "val": subsidy * 0.4 + budget_m * 0.8},
            {"id": "n_savings", "label": f"Transit Cost Savings: +${round(subsidy * 12, 0)}/yr/user", "type": "positive", "val": subsidy * 12},
            {"id": "n_budget", "label": f"City Budget Drain: -${round(budget_m + (subsidy * 0.8), 1)}M/yr", "type": "negative", "val": -(budget_m + subsidy * 0.8)},
            {"id": "n_congestion", "label": f"Road Gridlock: -{round(subsidy * 0.2 + budget_m * 0.3, 1)}%", "type": "positive", "val": -(subsidy * 0.2 + budget_m * 0.3)},
            {"id": "n_equity", "label": "Outer Suburb Accessibility: +18%", "type": "positive", "val": 18.0},
            {"id": "n_aqi", "label": "Urban Air Pollutants: -9.5%", "type": "positive", "val": -9.5},
            {"id": "n_steps", "label": "Daily Citizen Active Steps: +800", "type": "positive", "val": 800}
        ]
        links = [
            {"source": "p_origin", "target": "n_ridership"},
            {"source": "p_origin", "target": "n_savings"},
            {"source": "p_origin", "target": "n_budget"},
            {"source": "p_origin", "target": "n_congestion"},
            {"source": "n_ridership", "target": "n_congestion"},
            {"source": "n_ridership", "target": "n_steps"},
            {"source": "n_savings", "target": "n_equity"},
            {"source": "n_congestion", "target": "n_aqi"}
        ]

    elif policy_id == "carbon_tax":
        tax = float(parameters.get("tax_rate", 40.0))
        subsidy = float(parameters.get("green_subsidy", 25.0))

        # Math deltas
        deltas["economy"] = -0.05 * tax + 0.05 * subsidy
        deltas["environment"] = 0.1 * tax + 0.2 * subsidy
        deltas["mobility"] = 0.02 * tax + 0.02 * subsidy
        deltas["equity"] = -0.05 * tax + 0.15 * subsidy
        deltas["health"] = 0.08 * tax + 0.12 * subsidy

        nodes = [
            {"id": "p_origin", "label": f"Carbon Tax: ${tax}/t + Green Subsidy", "type": "origin", "val": tax},
            {"id": "n_renewables", "label": f"Green Energy Share: +{round(subsidy * 1.2, 1)}%", "type": "positive", "val": subsidy * 1.2},
            {"id": "n_co2", "label": f"Industrial CO2 Output: -{round(tax * 0.3, 1)}%", "type": "positive", "val": -tax * 0.3},
            {"id": "n_energy_cost", "label": f"Electricity Rates: +{round(tax * 0.25 - subsidy * 0.3, 1)}%", "type": "negative" if (tax * 0.25 - subsidy * 0.3) > 0 else "positive", "val": tax * 0.25 - subsidy * 0.3},
            {"id": "n_revenue", "label": f"Tax Revenues: +${round(tax * 3.5, 1)}M/yr", "type": "positive", "val": tax * 3.5},
            {"id": "n_jobs", "label": "Green Infrastructure Jobs: +2,400", "type": "positive", "val": 2400},
            {"id": "n_health", "label": "Respiratory Illness Costs: -12.5%", "type": "positive", "val": 12.5}
        ]
        links = [
            {"source": "p_origin", "target": "n_renewables"},
            {"source": "p_origin", "target": "n_co2"},
            {"source": "p_origin", "target": "n_energy_cost"},
            {"source": "p_origin", "target": "n_revenue"},
            {"source": "n_renewables", "target": "n_jobs"},
            {"source": "n_co2", "target": "n_health"}
        ]

    elif policy_id == "wfh_mandate":
        days = float(parameters.get("wfh_days", 2.0))
        incentive = float(parameters.get("incentive_pct", 10.0))

        # Math deltas
        deltas["economy"] = 0.15 * days - 0.05 * incentive
        deltas["environment"] = 0.8 * days + 0.03 * incentive
        deltas["mobility"] = 1.2 * days + 0.05 * incentive
        deltas["equity"] = 0.4 * days + 0.03 * incentive
        deltas["health"] = 0.6 * days + 0.05 * incentive

        nodes = [
            {"id": "p_origin", "label": f"WFH mandate: {days} days/wk", "type": "origin", "val": days},
            {"id": "n_commutes", "label": f"Commuting Trips: -{round(days * 18, 1)}%", "type": "positive", "val": -days * 18},
            {"id": "n_office", "label": f"Office Space Utilization: -{round(days * 15, 1)}%", "type": "negative", "val": -days * 15},
            {"id": "n_retail", "label": f"CBD Service Retail Spend: -{round(days * 8.5, 1)}%", "type": "negative", "val": -days * 8.5},
            {"id": "n_stress", "label": "Citizen Commuting Stress: -35%", "type": "positive", "val": 35.0},
            {"id": "n_rent", "label": "Commercial Real Estate Rent: -12.4%", "type": "positive", "val": -12.4},
            {"id": "n_emissions", "label": f"Transport Emissions: -{round(days * 14.5, 1)}%", "type": "positive", "val": -days * 14.5}
        ]
        links = [
            {"source": "p_origin", "target": "n_commutes"},
            {"source": "p_origin", "target": "n_office"},
            {"source": "n_commutes", "target": "n_stress"},
            {"source": "n_commutes", "target": "n_emissions"},
            {"source": "n_office", "target": "n_rent"},
            {"source": "n_office", "target": "n_retail"}
        ]

    elif policy_id == "green_canopy":
        trees = float(parameters.get("canopy_target", 15.0))
        maint = float(parameters.get("maint_budget_m", 5.0))

        # Math deltas
        deltas["economy"] = -0.1 * trees - 0.15 * maint
        deltas["environment"] = 0.4 * trees + 0.15 * maint
        deltas["mobility"] = 0.02 * trees
        deltas["equity"] = 0.1 * trees + 0.08 * maint
        deltas["health"] = 0.25 * trees + 0.1 * maint

        nodes = [
            {"id": "p_origin", "label": f"Planting Target: +{trees}% Canopy", "type": "origin", "val": trees},
            {"id": "n_temp", "label": f"Summer Heat Island: -{round(trees * 0.15, 2)}°C", "type": "positive", "val": -trees * 0.15},
            {"id": "n_shade", "label": "Walkability / Shade Area: +28%", "type": "positive", "val": 28.0},
            {"id": "n_cost", "label": f"Initial/Maintenance Budget: ${round(trees * 1.5 + maint, 1)}M", "type": "negative", "val": -(trees * 1.5 + maint)},
            {"id": "n_air", "label": "Particulate Absorption: +14%", "type": "positive", "val": 14.0},
            {"id": "n_mental", "label": "Citizen Psychological Stress: -18%", "type": "positive", "val": -18.0},
            {"id": "n_property", "label": "Green Sector Property Values: +8.5%", "type": "positive", "val": 8.5}
        ]
        links = [
            {"source": "p_origin", "target": "n_temp"},
            {"source": "p_origin", "target": "n_shade"},
            {"source": "p_origin", "target": "n_cost"},
            {"source": "p_origin", "target": "n_air"},
            {"source": "n_temp", "target": "n_property"},
            {"source": "n_air", "target": "n_mental"}
        ]

    # 3. Calculate final scores ensuring bounds [10.0, 95.0] to keep it realistic
    final_scores = {}
    for sector in ["economy", "environment", "mobility", "equity", "health"]:
        base_val = base_scores[sector]
        delta_val = deltas[sector]
        final_scores[sector] = round(min(95.0, max(10.0, base_val + delta_val)), 1)

    # 4. Generate 5-year projections
    projections = _build_projections(base_scores, deltas)

    return {
        "final_scores": final_scores,
        "projections": projections,
        "ripple_graph": {
            "nodes": nodes,
            "links": links
        }
    }

def calculate_generic_simulation(city_data: dict, policy_name: str, engine_config: dict, parameters: dict) -> dict:
    """
    Generic quantitative engine for AI auto-generated policies (Feature: AI Policy Search).
    Instead of hardcoded per-policy math, this reads per-parameter sector coefficients
    (score points of impact per 1 unit of the parameter) out of `engine_config`, which was
    produced at generation time (either by Gemini or the deterministic mock fallback).

    engine_config shape:
    {
        "params": [{"key": ..., "label": ..., "min": ..., "max": ..., "default": ..., "step": ..., "unit": ...}, ...],
        "coefficients": {"economy": {"param_key": weight, ...}, "environment": {...}, "mobility": {...}, "equity": {...}, "health": {...}},
        "impact_levers": ["short phrase describing a downstream effect", ...]
    }
    """
    base_scores = _compute_base_scores(city_data)
    coefficients = engine_config.get("coefficients", {})
    param_defs = {p["key"]: p for p in engine_config.get("params", [])}

    # 1. Linear deltas: sum(weight_per_unit * applied_parameter_value) per sector
    deltas = {"economy": 0.0, "environment": 0.0, "mobility": 0.0, "equity": 0.0, "health": 0.0}
    for sector in deltas.keys():
        sector_weights = coefficients.get(sector, {})
        total = 0.0
        for param_key, weight in sector_weights.items():
            value = float(parameters.get(param_key, param_defs.get(param_key, {}).get("default", 0.0)))
            total += float(weight) * value
        deltas[sector] = total

    # 2. Final scores, bounded like the hardcoded engine
    final_scores = {}
    for sector in ["economy", "environment", "mobility", "equity", "health"]:
        final_scores[sector] = round(min(95.0, max(10.0, base_scores[sector] + deltas[sector])), 1)

    # 3. Projections
    projections = _build_projections(base_scores, deltas)

    # 4. Ripple graph, built generically from the impact_levers + sign of each sector's delta
    primary_param = engine_config.get("params", [{}])[0] if engine_config.get("params") else {}
    primary_key = primary_param.get("key")
    primary_value = parameters.get(primary_key, primary_param.get("default", 0))
    primary_unit = primary_param.get("unit", "")

    nodes = [{
        "id": "p_origin",
        "label": f"{policy_name}: {primary_value}{primary_unit}",
        "type": "origin",
        "val": float(primary_value) if isinstance(primary_value, (int, float)) else 0.0
    }]
    links = []

    sector_order = ["mobility", "environment", "economy", "health", "equity"]
    impact_levers = engine_config.get("impact_levers", []) or []
    for i, lever_text in enumerate(impact_levers[:6]):
        sector = sector_order[i % len(sector_order)]
        magnitude = round(deltas.get(sector, 0.0) * (0.6 + 0.15 * i), 1)
        node_id = f"n_lever_{i}"
        nodes.append({
            "id": node_id,
            "label": f"{lever_text}: {'+' if magnitude >= 0 else ''}{magnitude}%",
            "type": "positive" if magnitude >= 0 else "negative",
            "val": magnitude
        })
        links.append({"source": "p_origin", "target": node_id})
        # Chain every other node for a bit of visual depth, mirroring the hand-authored graphs
        if i >= 2:
            links.append({"source": f"n_lever_{i-2}", "target": node_id})

    return {
        "final_scores": final_scores,
        "projections": projections,
        "ripple_graph": {
            "nodes": nodes,
            "links": links
        }
    }
