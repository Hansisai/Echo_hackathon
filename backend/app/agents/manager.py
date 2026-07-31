import json
import logging
import concurrent.futures
from google import genai
from google.genai import types
from backend.app.config import settings
from backend.app.agents.templates import (
    SYSTEM_PROMPTS, 
    SHARED_INSTRUCTION, 
    compile_user_prompt, 
    compile_bundled_user_prompt,
    compile_meta_user_prompt
)

logger = logging.getLogger("living_policy")

def run_single_agent(agent_name: str, city_name: str, city_stats: dict, policy_id: str, policy_name: str, parameters: dict, engine_results: dict) -> dict:
    """
    Invokes Gemini for a single agent, falling back to a realistic mock if API fails/missing.
    """
    system_prompt = SYSTEM_PROMPTS.get(agent_name, SHARED_INSTRUCTION)
    user_prompt = compile_user_prompt(city_name, city_stats, policy_name, parameters, engine_results)

    # If API key exists, attempt the call
    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            
            # Clean and parse the response text
            text = response.text.strip()
            # Remove markdown backticks if Gemini accidentally includes them
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```json"):
                    text = "\n".join(lines[1:-1])
                elif lines[0].startswith("```"):
                    text = "\n".join(lines[1:-1])
            
            parsed_json = json.loads(text.strip())
            return {
                "agent_name": agent_name,
                "transcript": parsed_json.get("message", ""),
                "score": float(parsed_json.get("score", 50)),
                "sentiment": parsed_json.get("sentiment", "neutral"),
                "risks": parsed_json.get("risks", []),
                "mitigations": parsed_json.get("mitigations", [])
            }
        except Exception as e:
            logger.warning(f"Failed to generate content via Gemini API for agent '{agent_name}': {e}. Falling back to mock.")
            
    # Mock fallback logic based on the calculated engine results
    score = float(engine_results["final_scores"].get(agent_name, 50.0))
    if agent_name == "infrastructure":
        score = float((engine_results["final_scores"].get("mobility", 50.0) + engine_results["final_scores"].get("environment", 50.0)) / 2)

    # Sentiment derivation
    if score >= 75.0:
        sentiment = "positive"
    elif score <= 45.0:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Pre-crafted high quality mock comments depending on policy
    transcripts = {
        "economy": {
            "congestion_pricing": f"Imposing congestion charges generates vital municipal funds (targeted at transit reinvestment), but adds direct overhead for small businesses operating delivery routes within the city center.",
            "metro_fare_subsidy": f"While a metro fare subsidy triggers a positive shift in ridership, it places a heavy recurring burden on the city budget. Infrastructure build-outs must show long-term productivity gains.",
            "carbon_tax": f"Levying carbon taxation shifts regulatory costs to local industrial sectors, which could cause a temporary contraction in employment unless clean energy subsidies generate offset jobs.",
            "wfh_mandate": f"A WFH strategy relieves commuting gridlock and operational office overhead, but shifts consumer spend out of core retail districts to suburban nodes.",
            "green_canopy": f"Expanding neighborhood canopies carries substantial planting capital demands, but elevates long-term residential land values and promotes municipal wellness savings."
        },
        "transport": {
            "congestion_pricing": f"We record a significant drop in vehicular traffic, alleviating critical bottle-necks. The revenue stream should immediately subsidize high-capacity corridors.",
            "metro_fare_subsidy": f"Metro capacity loads must rise to absorb commuting shifts. We recommend accelerating station platform expansions to avoid safety bottlenecks.",
            "carbon_tax": f"Clean fuel pricing is critical to nudge modal splits. Private-vehicle dependency falls as commercial logistics switch to electric distribution systems.",
            "wfh_mandate": f"Alleviating peak congestion reduces expressway wear and tear, allowing us to defer expensive highway widening programs in favor of active transit lanes.",
            "green_canopy": f"Street tree planting corridors must align with cycling paths to create protected, shaded corridors that support active, non-motorized travel."
        },
        "environment": {
            "congestion_pricing": f"A clear environmental win. Clean-air microclimates will emerge in urban zones, and PM2.5 metrics will display a healthy contraction.",
            "metro_fare_subsidy": f"Modal shifts from single-occupancy vehicles to electric transit lines are essential to lowering carbon-equivalent indexes per capita.",
            "carbon_tax": f"Taxes on corporate pollution effectively penalize high-carbon manufacturing, accelerating transition programs to rooftop solar and grid storage.",
            "wfh_mandate": f"Commute reduction is the single fastest mechanism to slash localized greenhouse gas concentrations. Ozone exposure risks drop.",
            "green_canopy": f"Canopy growth is the ultimate defense against the urban heat island effect, offering immediate carbon storage and shade benefits."
        },
        "healthcare": {
            "congestion_pricing": f"Reduced vehicle exhaust translates directly to lower pediatric asthma emergency room admissions. Walkable transit hubs also support citizen fitness.",
            "metro_fare_subsidy": f"Less traffic stress and cleaner air promote overall cardiac wellness. Active walking to and from transit centers increases daily steps.",
            "carbon_tax": f"Transitioning away from carbon-intensive power grids lowers particulate emissions, reducing the rate of cardiopulmonary cases in surrounding communities.",
            "wfh_mandate": f"Reduced commuting stress and more personal time have immediate mental health benefits, although remote isolation requires monitor checking.",
            "green_canopy": f"High shade cover lowers summer heatstroke rates, while direct exposure to green vegetation lowers cortisol levels and boosts mental well-being."
        },
        "citizen": {
            "congestion_pricing": f"A flat congestion fee operates as a regressive tax, disproportionately punishing outer-suburb workers. We demand low-income exemptions.",
            "metro_fare_subsidy": f"A major equity success. Accessible, cheap transit is a fundamental citizen right that saves lower-income households hundreds of dollars annually.",
            "carbon_tax": f"If corporations pass carbon taxes down through energy utility bills, the cost of living index spikes, which negatively impacts low-income groups.",
            "wfh_mandate": f"Flexible work schedules give hours back to working families, though service-sector employees who cannot work remotely face equity gaps.",
            "green_canopy": f"Trees improve urban aesthetics and reduce neighborhood summer heat, but planting must be prioritized in historically lower-income neighborhoods first."
        },
        "infrastructure": {
            "congestion_pricing": f"Traffic redirection onto secondary arterial roads requires intelligent light timing upgrades and road bed reinforcing.",
            "metro_fare_subsidy": f"Heavy passenger surge demands upgrading power sub-stations along metro lines and expanding maintenance facility capacity.",
            "carbon_tax": f"Industrial clean-tech shifts will spike localized grid demand; we must deploy smart transformers and expanded battery buffer banks.",
            "wfh_mandate": f"Commercial utility loads shift into residential suburbs. Suburban power distribution transformers must be reinforced.",
            "green_canopy": f"Sub-surface root systems must be managed to protect underground fiber cables, water mains, and power lines during street planting."
        }
    }

    risks_data = {
        "economy": ["Localized business cost increases", "Capital expenditure strain on municipal budget"],
        "transport": ["Peak hour transit capacity bottlenecks", "Revenue shortfall if usage shifts abruptly"],
        "environment": ["Potential displacement of emissions to outer ring", "Ecosystem monitoring overhead"],
        "healthcare": ["Increased pedestrian density in transit hubs", "Commuter stress during transition"],
        "citizen": ["Regressive cost impact on low-income groups", "Unequal geographic benefit distribution"],
        "infrastructure": ["Utility root damage risks", "Grid load spikes in residential zones"]
    }

    mitigations_data = {
        "economy": ["Provide tax offsets for inner-city retailers", "Reinvest tax revenue into utility subsidies"],
        "transport": ["Increase bus transit frequencies immediately", "Create suburban park-and-ride nodes"],
        "environment": ["Incentivize local cargo deliveries to use EVs", "Expand green grid storage capacity"],
        "healthcare": ["Develop walkability paths along transit lines", "Install air monitors near schools"],
        "citizen": ["Implement income-based charge exemptions", "Subsidize outer zone bus feeder links"],
        "infrastructure": ["Coordinate root barrier guidelines with forestry", "Upgrade suburban power transformer nodes"]
    }

    policy_transcripts = transcripts.get(agent_name, {})
    comment = policy_transcripts.get(policy_id, f"The policy execution exhibits measurable impacts across the {agent_name} sector dynamics.")

    return {
        "agent_name": agent_name,
        "transcript": comment,
        "score": round(score, 1),
        "sentiment": sentiment,
        "risks": risks_data.get(agent_name, []),
        "mitigations": mitigations_data.get(agent_name, [])
    }


def run_meta_decision_agent(city_name: str, city_stats: dict, policy_name: str, parameters: dict, engine_results: dict, advisor_reports: list) -> dict:
    """
    Executes the 7th Meta-Decision Agent (Athena) synthesizing deliberations from all 6 sector advisors.
    Calculates weighted scoring, conflict resolutions, decision recommendation, confidence score (0.0 to 1.0 float), and alternative pathways.
    """
    system_prompt = SYSTEM_PROMPTS.get("meta_decision", "")
    user_prompt = compile_meta_user_prompt(city_name, city_stats, policy_name, parameters, engine_results, advisor_reports)

    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.6
                )
            )
            text = response.text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```json"):
                    text = "\n".join(lines[1:-1])
                elif lines[0].startswith("```"):
                    text = "\n".join(lines[1:-1])
            
            parsed = json.loads(text.strip())
            conf_val = float(parsed.get("confidence_score", 0.85))
            if conf_val > 1.0:
                conf_val = round(conf_val / 100.0, 2)

            return {
                "agent_name": "athena",
                "transcript": parsed.get("message", "Athena executive synthesis complete."),
                "score": float(parsed.get("score", 75)),
                "sentiment": parsed.get("sentiment", "positive"),
                "risks": parsed.get("risks", ["Cross-sector consensus trade-offs"]),
                "mitigations": parsed.get("mitigations", ["Establish multi-agency coordination taskforce"]),
                "decision": parsed.get("decision", "modify"),
                "confidence_score": conf_val,
                "justification": parsed.get("justification", "Synthesized across 6 advisor perspectives."),
                "alternative_pathways": parsed.get("alternative_pathways", ["Bundle with targeted subsidies", "Phase rollout over 3 years"])
            }
        except Exception as e:
            logger.warning(f"Failed to generate content via Gemini API for Athena Meta-Decision Agent: {e}. Falling back to mock synthesis.")

    # Mock fallback synthesis logic
    scores = [float(r.get("score", 50)) for r in advisor_reports]
    avg_score = sum(scores) / len(scores) if scores else 50.0
    score_spread = max(scores) - min(scores) if scores else 0.0

    if avg_score >= 75.0:
        decision = "approve"
        sentiment = "positive"
    elif avg_score <= 45.0:
        decision = "reject"
        sentiment = "negative"
    elif score_spread > 35.0:
        decision = "modify"
        sentiment = "neutral"
    else:
        decision = "bundle"
        sentiment = "positive"

    conf_score = round(max(0.55, min(0.96, 1.0 - (score_spread / 150.0))), 2)

    all_risks = []
    all_mitigations = []
    for r in advisor_reports:
        all_risks.extend(r.get("risks", []))
        all_mitigations.extend(r.get("mitigations", []))

    consensus_risks = list(dict.fromkeys(all_risks))[:3]
    consensus_mitigations = list(dict.fromkeys(all_mitigations))[:3]

    justification_str = (
        f"Athena synthesis evaluated all 6 advisor domain perspectives. "
        f"Eva (Economy) and Atlas (Transport) provided core index projections, while Gaia (Environment), Hygeia (Healthcare), Sophia (Citizen Equity), and Prometheus (Infrastructure) highlighted sector trade-offs. "
        f"Weighted multi-sector score stands at {round(avg_score, 1)}/100."
    )

    return {
        "agent_name": "athena",
        "transcript": f"Meta-Decision Executive Synthesis: {policy_name} achieves a weighted consensus score of {round(avg_score, 1)}/100. Recommendation is to {decision.upper()} with targeted sector mitigations.",
        "score": round(avg_score, 1),
        "sentiment": sentiment,
        "risks": consensus_risks or ["Cross-sector consensus trade-offs"],
        "mitigations": consensus_mitigations or ["Establish multi-agency coordination taskforce"],
        "decision": decision,
        "confidence_score": conf_score,
        "justification": justification_str,
        "alternative_pathways": [
            f"Convert {policy_name} into a phased multi-year transition plan",
            "Pair policy with low-income fare or tax exemptions to boost equity",
            "Bundle with complementary green infrastructure investments"
        ]
    }


def run_all_agents(city_name: str, city_stats: dict, policy_id: str, policy_name: str, parameters: dict, engine_results: dict) -> list:
    """
    Executes deliberations of all 6 sector agents in parallel, then synthesizes via 7th Meta-Decision Agent (Athena).
    """
    agent_names = ["economy", "transport", "environment", "healthcare", "citizen", "infrastructure"]
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        future_to_agent = {
            executor.submit(run_single_agent, agent, city_name, city_stats, policy_id, policy_name, parameters, engine_results): agent
            for agent in agent_names
        }
        
        results = []
        for future in concurrent.futures.as_completed(future_to_agent):
            agent = future_to_agent[future]
            try:
                data = future.result()
                results.append(data)
            except Exception as exc:
                logger.error(f"Agent '{agent}' generated an exception during run: {exc}")
                results.append({
                    "agent_name": agent,
                    "transcript": "Deliberation failed due to an internal execution error.",
                    "score": 50.0,
                    "sentiment": "neutral",
                    "risks": ["Execution pipeline failure"],
                    "mitigations": ["Contact support administrator"]
                })
                
    order = {name: i for i, name in enumerate(agent_names)}
    results.sort(key=lambda x: order.get(x["agent_name"], 99))

    # Run 7th Meta-Decision Agent (Athena)
    meta_report = run_meta_decision_agent(
        city_name=city_name,
        city_stats=city_stats,
        policy_name=policy_name,
        parameters=parameters,
        engine_results=engine_results,
        advisor_reports=results
    )
    results.append(meta_report)
    return results


def run_single_bundled_agent(agent_name: str, city_name: str, city_stats: dict, policy_names: list, all_parameters: dict, engine_results: dict, synergies_conflicts: list) -> dict:
    """
    Invokes Gemini for a single agent evaluating a multi-policy bundle.
    """
    system_prompt = SYSTEM_PROMPTS.get(agent_name, SHARED_INSTRUCTION)
    user_prompt = compile_bundled_user_prompt(city_name, city_stats, policy_names, all_parameters, engine_results, synergies_conflicts)

    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            text = response.text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```json"):
                    text = "\n".join(lines[1:-1])
                elif lines[0].startswith("```"):
                    text = "\n".join(lines[1:-1])
            
            parsed_json = json.loads(text.strip())
            return {
                "agent_name": agent_name,
                "transcript": parsed_json.get("message", ""),
                "score": float(parsed_json.get("score", 50)),
                "sentiment": parsed_json.get("sentiment", "neutral"),
                "risks": parsed_json.get("risks", []),
                "mitigations": parsed_json.get("mitigations", [])
            }
        except Exception as e:
            logger.warning(f"Failed to generate bundled content via Gemini API for agent '{agent_name}': {e}. Falling back to mock.")

    score = float(engine_results["final_scores"].get(agent_name, 50.0))
    if agent_name == "infrastructure":
        score = float((engine_results["final_scores"].get("mobility", 50.0) + engine_results["final_scores"].get("environment", 50.0)) / 2)

    if score >= 75.0:
        sentiment = "positive"
    elif score <= 45.0:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    policies_formatted = " + ".join(policy_names)
    syn_count = len([s for s in synergies_conflicts if s.get("type") == "synergy"])

    transcripts_bundle = {
        "economy": f"The bundled deployment of {policies_formatted} balances municipal revenue generation with target subsidies. We record {syn_count} positive economic/mobility synergies offsetting short-term transition costs.",
        "transport": f"Combining {policies_formatted} creates a powerful multimodal transportation shift. Modal share moves rapidly toward mass transit while reducing highway bottleneck strain.",
        "environment": f"Evaluating {policies_formatted} together reveals exponential carbon reduction benefits. Industrial decarbonization and transit shifts create clear air quality gains.",
        "healthcare": f"The combined policy package reduces localized smog exposure and promotes active walking, resulting in fewer respiratory ER visits and reduced citizen stress.",
        "citizen": f"While joint policies provide high long-term quality of life improvements, low-income equity must be safeguarded against cumulative toll or utility cost strains.",
        "infrastructure": f"Executing {policies_formatted} concurrently demands coordinated electrical grid and fiber network scaling to support high-density public demand."
    }

    risks_data = {
        "economy": ["Multi-policy administrative overhead", "Simultaneous revenue and expenditure tracking strain"],
        "transport": ["High transit hub passenger bottlenecks", "Inter-modal transfer delays"],
        "environment": ["Localized grid load surges during transition"],
        "healthcare": ["Commuter density risks at peak transit hubs"],
        "citizen": ["Compounded living cost strains if fees overlap"],
        "infrastructure": ["Concurrent grid and telecommunication load spikes"]
    }

    mitigations_data = {
        "economy": ["Establish unified policy implementation taskforce", "Ring-fence policy revenues for equity rebates"],
        "transport": ["Synchronize transit timetables", "Deploy high-capacity express corridor buses"],
        "environment": ["Accelerate rooftop solar and battery storage installation"],
        "healthcare": ["Upgrade station ventilation and medical response nodes"],
        "citizen": ["Implement targeted income-based fee exemptions and subsidies"],
        "infrastructure": ["Implement smart-grid load balancing and edge server upgrades"]
    }

    return {
        "agent_name": agent_name,
        "transcript": transcripts_bundle.get(agent_name, f"Joint evaluation of {policies_formatted} shows comprehensive cross-sector impacts."),
        "score": round(score, 1),
        "sentiment": sentiment,
        "risks": risks_data.get(agent_name, ["Joint implementation coordination challenges"]),
        "mitigations": mitigations_data.get(agent_name, ["Form joint cross-department steering committee"])
    }


def run_all_bundled_agents(city_name: str, city_stats: dict, policy_names: list, all_parameters: dict, engine_results: dict, synergies_conflicts: list) -> list:
    """
    Executes multi-policy bundled deliberation of all 6 agents in parallel, then synthesizes via 7th Meta-Decision Agent (Athena).
    """
    agent_names = ["economy", "transport", "environment", "healthcare", "citizen", "infrastructure"]
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        future_to_agent = {
            executor.submit(
                run_single_bundled_agent, 
                agent, 
                city_name, 
                city_stats, 
                policy_names, 
                all_parameters, 
                engine_results,
                synergies_conflicts
            ): agent for agent in agent_names
        }
        
        results = []
        for future in concurrent.futures.as_completed(future_to_agent):
            agent = future_to_agent[future]
            try:
                data = future.result()
                results.append(data)
            except Exception as exc:
                logger.error(f"Bundled agent '{agent}' generated an exception during run: {exc}")
                results.append({
                    "agent_name": agent,
                    "transcript": "Bundled deliberation failed due to an internal execution error.",
                    "score": 50.0,
                    "sentiment": "neutral",
                    "risks": ["Execution pipeline failure"],
                    "mitigations": ["Contact support administrator"]
                })
                
    order = {name: i for i, name in enumerate(agent_names)}
    results.sort(key=lambda x: order.get(x["agent_name"], 99))

    # Append 7th Meta-Decision Agent report (Athena)
    meta_report = run_meta_decision_agent(
        city_name=city_name,
        city_stats=city_stats,
        policy_name=" + ".join(policy_names),
        parameters=all_parameters,
        engine_results=engine_results,
        advisor_reports=results
    )
    results.append(meta_report)
    return results
