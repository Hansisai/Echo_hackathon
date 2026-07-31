import json
import logging
import concurrent.futures
import urllib.request
import urllib.error
from backend.app.config import settings
from backend.app.agents.templates import SYSTEM_PROMPTS, compile_user_prompt

logger = logging.getLogger("living_policy")

def run_single_agent(agent_name: str, city_name: str, city_stats: dict, policy_id: str, policy_name: str, parameters: dict, engine_results: dict) -> dict:
    """
    Invokes Featherless AI for a single agent, falling back to a realistic mock if API fails/missing.
    """
    system_prompt = SYSTEM_PROMPTS.get(agent_name, SHARED_INSTRUCTION := "")
    user_prompt = compile_user_prompt(city_name, city_stats, policy_name, parameters, engine_results)

    # If API key exists, attempt the call
    if settings.FEATHERLESS_API_KEY:
        try:
            url = "https://api.featherless.ai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.FEATHERLESS_API_KEY}",
                "Content-Type": "application/json"
            }
            data = {
                "model": settings.FEATHERLESS_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "response_format": {"type": "json_object"}
            }
            
            req_body = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(url, data=req_body, headers=headers, method="POST")
            
            with urllib.request.urlopen(req, timeout=30) as response:
                resp_body = response.read().decode("utf-8")
                resp_data = json.loads(resp_body)
                text = resp_data["choices"][0]["message"]["content"].strip()
            
            # Clean and parse the response text
            # Remove markdown backticks if model accidentally includes them
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
            logger.warning(f"Failed to generate content via Featherless API for agent '{agent_name}': {e}. Falling back to mock.")
            
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
            "wfh_mandate": f"WFH options are a major benefit for white-collar workers, but service and physical industry workers do not share this flexibility, creating inequality.",
            "green_canopy": f"We must ensure tree-planting campaigns target historically under-resourced districts first to avoid environmental gentrification."
        },
        "infrastructure": {
            "congestion_pricing": f"Charging tolls requires automated smart cameras and license scanners, placing an immediate demand on fiber networks and edge servers.",
            "metro_fare_subsidy": f"Subsidies require building out smart ticketing cards and real-time station analytics systems to balance peak commute loads.",
            "carbon_tax": f"A carbon tax accelerates the retirement of fossil fuel plants. We must rapidly build out grid storage batteries to avoid peak power failures.",
            "wfh_mandate": f"A sudden shift to home offices increases residential internet traffic and water consumption, placing higher demands on residential utility nodes.",
            "green_canopy": f"Urban tree roots can interfere with underground water and power lines. Coordinated planning with utility mapping is critical."
        }
    }

    # Extract template text, default if missing
    policy_templates = transcripts.get(agent_name, {})
    transcript_text = policy_templates.get(
        policy_id, 
        f"The proposed {policy_name} requires careful coordination across local departments to balance funding allocations and long-term sustainability goals."
    )

    # Standard default risk/mitigation arrays
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

    return {
        "agent_name": agent_name,
        "transcript": transcript_text,
        "score": round(score, 1),
        "sentiment": sentiment,
        "risks": risks_data.get(agent_name, ["Unanticipated integration issues"]),
        "mitigations": mitigations_data.get(agent_name, ["Engage in cross-sector workshops"])
    }

def run_all_agents(city_name: str, city_stats: dict, policy_id: str, policy_name: str, parameters: dict, engine_results: dict) -> list:
    """
    Executes the deliberation of all 6 specialized agents in parallel threads.
    """
    agent_names = ["economy", "transport", "environment", "healthcare", "citizen", "infrastructure"]
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        # Create map of future objects to agent names
        future_to_agent = {
            executor.submit(
                run_single_agent, 
                agent, 
                city_name, 
                city_stats, 
                policy_id,
                policy_name, 
                parameters, 
                engine_results
            ): agent for agent in agent_names
        }
        
        results = []
        for future in concurrent.futures.as_completed(future_to_agent):
            agent = future_to_agent[future]
            try:
                data = future.result()
                results.append(data)
            except Exception as exc:
                logger.error(f"Agent '{agent}' generated an exception during run: {exc}")
                # Append a fallback object
                results.append({
                    "agent_name": agent,
                    "transcript": "Deliberation failed due to an internal execution error.",
                    "score": 50.0,
                    "sentiment": "neutral",
                    "risks": ["Execution pipeline failure"],
                    "mitigations": ["Contact support administrator"]
                })
                
    # Sort results to have a predictable order
    order = {name: i for i, name in enumerate(agent_names)}
    results.sort(key=lambda x: order.get(x["agent_name"], 99))
    return results
