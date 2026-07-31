import json
import math

def calculate_simulation(city_data: dict, policy_id: str, parameters: dict) -> dict:
    """
    Executes the quantitative policy simulation engine.
    Returns:
        - final_scores: Dict of 5-year end scores for 5 sectors (0-100)
        - projections: 5-year yearly timeline of metrics
        - ripple_graph: Node-link schema for causal flow visualization
    """
    # 1. Establish base index values (0-100 scale) from city data
    pop = city_data.get("population", 1000000)
    transit = city_data.get("transit_share", 20.0)
    commute = city_data.get("avg_commute_dist", 15.0)
    co2 = city_data.get("co2_baseline", 8.0)
    aqi = city_data.get("aqi_baseline", 100)
    income = city_data.get("median_income", 50000.0)
    health = city_data.get("health_index", 60.0)
    budget = city_data.get("municipal_budget", 1000.0)
    satisfaction = city_data.get("satisfaction_baseline", 50.0)

    # Base calculations mapping stats to 0-100 index scores
    base_economy = min(100.0, max(10.0, (income / 80000.0) * 50 + (budget / 5000.0) * 30))
    base_environment = min(100.0, max(10.0, (1 - (co2 / 20.0)) * 40 + (1 - (aqi / 300.0)) * 40))
    base_mobility = min(100.0, max(10.0, transit * 0.8 + (1 - (commute / 30.0)) * 30))
    base_equity = min(100.0, max(10.0, (income / 80000.0) * 30 + transit * 0.5 + satisfaction * 0.2))
    base_health = health

    # Sector base scores dictionary
    base_scores = {
        "economy": round(base_economy, 1),
        "environment": round(base_environment, 1),
        "mobility": round(base_mobility, 1),
        "equity": round(base_equity, 1),
        "health": round(base_health, 1)
    }

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
    projections = []
    for year in range(6):  # Year 0 (baseline) to Year 5
        coef = year / 5.0
        # Add a minor sinus wave fluctuation for realistic projections
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

    return {
        "final_scores": final_scores,
        "projections": projections,
        "ripple_graph": {
            "nodes": nodes,
            "links": links
        }
    }


def calculate_bundled_simulation(city_data: dict, bundles: list) -> dict:
    """
    Executes a joint multi-policy simulation run.
    bundles: List of dicts, e.g. [{"policy_id": "congestion_pricing", "parameters": {"fee": 12.0}}, ...]
    Returns:
        - final_scores: Joint 5-year end scores
        - baseline_scores: Unmodified starting baseline scores
        - single_policy_benchmarks: Scores for each individual policy evaluated alone
        - synergies_and_conflicts: List of synergy and conflict interaction objects
        - projections: Joint 5-year timeline projection
        - ripple_graph: Combined DAG graph with synergy and conflict nodes
    """
    # 1. Base calculations
    pop = city_data.get("population", 1000000)
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

    base_scores = {
        "economy": round(base_economy, 1),
        "environment": round(base_environment, 1),
        "mobility": round(base_mobility, 1),
        "equity": round(base_equity, 1),
        "health": round(base_health, 1)
    }

    # 2. Evaluate individual single-policy benchmarks
    single_benchmarks = {}
    policy_ids = []
    combined_nodes = []
    combined_links = []
    
    joint_deltas = {"economy": 0.0, "environment": 0.0, "mobility": 0.0, "equity": 0.0, "health": 0.0}

    for b in bundles:
        pid = b["policy_id"]
        params = b.get("parameters", {})
        policy_ids.append(pid)

        # Single run benchmark
        single_res = calculate_simulation(city_data, pid, params)
        single_benchmarks[pid] = single_res["final_scores"]

        # Collect nodes & links (prefix IDs to prevent collisions across policies)
        for n in single_res["ripple_graph"]["nodes"]:
            node_copy = dict(n)
            if node_copy["type"] != "origin":
                node_copy["id"] = f"{pid}_{node_copy['id']}"
            else:
                node_copy["id"] = f"origin_{pid}"
            combined_nodes.append(node_copy)

        for l in single_res["ripple_graph"]["links"]:
            src = f"origin_{pid}" if l["source"] == "p_origin" else f"{pid}_{l['source']}"
            tgt = f"origin_{pid}" if l["target"] == "p_origin" else f"{pid}_{l['target']}"
            combined_links.append({"source": src, "target": tgt})

        # Sum deltas from single run
        for sector in ["economy", "environment", "mobility", "equity", "health"]:
            joint_deltas[sector] += (single_res["final_scores"][sector] - base_scores[sector])

    # 3. Compute Synergies & Conflicts between policy pairs
    synergies_conflicts = []

    # Check Synergy 1: Congestion Pricing + Metro Subsidy
    if "congestion_pricing" in policy_ids and "metro_fare_subsidy" in policy_ids:
        synergies_conflicts.append({
            "type": "synergy",
            "title": "Modal Shift Transit Multiplier",
            "description": "Charging car tolls while simultaneously subsidizing metro fares creates a seamless incentive for drivers to switch to public transit.",
            "affected_sectors": ["mobility", "equity"],
            "magnitude": 6.5
        })
        joint_deltas["mobility"] += 5.0
        joint_deltas["equity"] += 4.0
        # Add DAG node
        combined_nodes.append({
            "id": "syn_modal_shift",
            "label": "SYNERGY: Transit Shift +15%",
            "type": "synergy",
            "val": 15.0
        })
        combined_links.append({"source": "origin_congestion_pricing", "target": "syn_modal_shift"})
        combined_links.append({"source": "origin_metro_fare_subsidy", "target": "syn_modal_shift"})

    # Check Synergy 2: Carbon Tax + Green Canopy
    if "carbon_tax" in policy_ids and "green_canopy" in policy_ids:
        synergies_conflicts.append({
            "type": "synergy",
            "title": "Ecological Microclimate Catalyst",
            "description": "Taxing industrial carbon while planting urban trees creates dual carbon sinks and rapidly improves city air quality.",
            "affected_sectors": ["environment", "health"],
            "magnitude": 7.0
        })
        joint_deltas["environment"] += 6.0
        joint_deltas["health"] += 4.0
        combined_nodes.append({
            "id": "syn_eco_catalyst",
            "label": "SYNERGY: Clean Air microclimate",
            "type": "synergy",
            "val": 20.0
        })
        combined_links.append({"source": "origin_carbon_tax", "target": "syn_eco_catalyst"})
        combined_links.append({"source": "origin_green_canopy", "target": "syn_eco_catalyst"})

    # Check Synergy 3: WFH Mandate + Congestion Pricing
    if "wfh_mandate" in policy_ids and "congestion_pricing" in policy_ids:
        synergies_conflicts.append({
            "type": "synergy",
            "title": "Peak Gridlock Elimination",
            "description": "Remote work flexibility reduces total trip volume, allowing congestion tolls to completely eliminate highway traffic jams.",
            "affected_sectors": ["mobility", "environment"],
            "magnitude": 5.0
        })
        joint_deltas["mobility"] += 4.0
        joint_deltas["environment"] += 3.0

    # Check Conflict 1: Congestion Pricing + Carbon Tax
    if "congestion_pricing" in policy_ids and "carbon_tax" in policy_ids:
        synergies_conflicts.append({
            "type": "conflict",
            "title": "Regressive Cost Strain Conflict",
            "description": "Simultaneous driving tolls and carbon-driven fuel tax increases disproportionately burden lower-income suburban commuters.",
            "affected_sectors": ["equity", "economy"],
            "magnitude": -6.0
        })
        joint_deltas["equity"] -= 5.0
        joint_deltas["economy"] -= 3.0
        combined_nodes.append({
            "id": "con_regressive_cost",
            "label": "CONFLICT: Double Citizen Cost Strain",
            "type": "conflict",
            "val": -12.0
        })
        combined_links.append({"source": "origin_congestion_pricing", "target": "con_regressive_cost"})
        combined_links.append({"source": "origin_carbon_tax", "target": "con_regressive_cost"})

    # Check Conflict 2: Metro Subsidy + Green Canopy
    if "metro_fare_subsidy" in policy_ids and "green_canopy" in policy_ids:
        synergies_conflicts.append({
            "type": "conflict",
            "title": "Municipal Budget Outlay Friction",
            "description": "Funding major transit expansion projects alongside large-scale tree planting places high concurrent demand on municipal capital reserves.",
            "affected_sectors": ["economy"],
            "magnitude": -4.5
        })
        joint_deltas["economy"] -= 4.0

    # 4. Final Scores bounded [10.0, 95.0]
    final_scores = {}
    for sector in ["economy", "environment", "mobility", "equity", "health"]:
        val = base_scores[sector] + joint_deltas[sector]
        final_scores[sector] = round(min(95.0, max(10.0, val)), 1)

    # 5. 5-Year Yearly Projections
    projections = []
    for year in range(6):
        coef = year / 5.0
        projections.append({
            "year": year,
            "economy": round(min(95.0, max(10.0, base_scores["economy"] + (joint_deltas["economy"] * coef))), 1),
            "environment": round(min(95.0, max(10.0, base_scores["environment"] + (joint_deltas["environment"] * coef))), 1),
            "mobility": round(min(95.0, max(10.0, base_scores["mobility"] + (joint_deltas["mobility"] * coef))), 1),
            "equity": round(min(95.0, max(10.0, base_scores["equity"] + (joint_deltas["equity"] * coef))), 1),
            "health": round(min(95.0, max(10.0, base_scores["health"] + (joint_deltas["health"] * coef))), 1),
        })

    return {
        "final_scores": final_scores,
        "baseline_scores": base_scores,
        "single_policy_benchmarks": single_benchmarks,
        "synergies_and_conflicts": synergies_conflicts,
        "projections": projections,
        "ripple_graph": {
            "nodes": combined_nodes,
            "links": combined_links
        }
    }

