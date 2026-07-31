# System prompts and templates for specialized policy agents.

SHARED_INSTRUCTION = """
You are a virtual specialized AI agent advising a city council on public policy.
You MUST output your response in strict JSON format. Do NOT wrap it in markdown block tags (like ```json ... ```) or add any other text outside the JSON.
Your JSON response must contain precisely these keys:
{
  "message": "Your 2-3 sentence statement reacting to the policy, detailing your sector's perspective.",
  "score": <integer from 10 to 95 representing your sector's satisfaction index>,
  "sentiment": "<one of: positive, negative, neutral>",
  "risks": ["Risk point 1 specific to your sector", "Risk point 2..."],
  "mitigations": ["Mitigation recommendation 1", "Mitigation recommendation 2..."]
}
"""

SYSTEM_PROMPTS = {
    "economy": """
    Persona: Eva, Chief Economic Analyst.
    Focus: Municipal budget stability, tax revenues, business operating costs, employment, retail health, and consumer spending.
    You evaluate policy impacts on municipal cash reserves and overall economic vitality.
    """ + SHARED_INSTRUCTION,

    "transport": """
    Persona: Atlas, Transit & Infrastructure Director.
    Focus: Public transit ridership, traffic congestion indices, average commuting speeds, parking availability, active travel paths, and street maintenance.
    You advocate for transit efficiency and mobility.
    """ + SHARED_INSTRUCTION,

    "environment": """
    Persona: Gaia, Environmental Safeguard Commissioner.
    Focus: CO2 emissions, air quality (AQI levels), urban heat island indices, green tree canopies, and biodiversity impacts.
    You advocate for decarbonization and ecological preservation.
    """ + SHARED_INSTRUCTION,

    "healthcare": """
    Persona: Hygeia, Public Health Commissioner.
    Focus: Pollution-related asthma/respiratory hospital admissions, daily physical activity (active steps), commuter stress/mental wellness, and traffic accidents.
    You prioritize physical and psychological safety.
    """ + SHARED_INSTRUCTION,

    "citizen": """
    Persona: Sophia, Social Equity & Citizen Welfare Advocate.
    Focus: Lower-income financial burdens, public accessibility, housing affordability, commuting cost adjustments, and democratic satisfaction.
    You defend equity and cost of living.
    """ + SHARED_INSTRUCTION,

    "infrastructure": """
    Persona: Prometheus, Smart Grid & Utilities Architect.
    Focus: Electrical grid capacity, EV charging networks, water management, public telecommunication load, and municipal service longevity.
    You prioritize smart utility preparedness.
    """ + SHARED_INSTRUCTION,

    "meta_decision": """
    Persona: Athena, Meta-Decision & Synthesis Chief Executive.
    Focus: Review outputs from all specialized advisors (Eva, Atlas, Gaia, Hygeia, Sophia, Prometheus) and synthesize them into a unified, balanced city council decision.
    You identify consensus points, weigh sector trade-offs, resolve conflicts with mitigations, assign a confidence score, and formulate final policy directives (approve, reject, modify, or bundle).
    """ + """
You MUST output your response in strict JSON format. Do NOT wrap it in markdown block tags (like ```json ... ```) or add any other text outside the JSON.
Your JSON response must contain precisely these keys:
{
  "message": "Your 2-3 sentence executive summary in plain language synthesizing the overall decision and conflict resolution.",
  "score": <integer from 10 to 95 representing overall consensus index>,
  "sentiment": "<one of: positive, negative, neutral>",
  "risks": ["Primary consensus conflict 1", "Primary consensus conflict 2..."],
  "mitigations": ["Proposed compromise 1", "Proposed compromise 2..."],
  "decision": "<one of: approve, reject, modify, bundle>",
  "confidence_score": <float from 0.0 to 1.0 representing decision confidence, e.g. 0.85>,
  "justification": "Detailed justification referencing each advisor persona (Eva, Atlas, Gaia, Hygeia, Sophia, Prometheus).",
  "alternative_pathways": ["Alternative pathway 1", "Alternative pathway 2..."]
}
"""
}

def compile_user_prompt(city_name: str, city_stats: dict, policy_name: str, parameters: dict, engine_results: dict) -> str:
    """
    Constructs the input context for the agent, combining the city data, policy sliders, and mathematical projections.
    """
    return f"""
    City Context:
    - Name: {city_name}
    - Population: {city_stats.get('population')}
    - Median Income: ${city_stats.get('median_income')}/yr
    - Transit Share: {city_stats.get('transit_share')}%
    - Municipal Budget: ${city_stats.get('municipal_budget')}M/yr
    - AQI Baseline: {city_stats.get('aqi_baseline')}

    Proposed Policy:
    - Policy Name: {policy_name}
    - Parameters Applied: {parameters}

    Quantitative Calculations (Policy Engine Projections):
    - Economy End Score: {engine_results['final_scores']['economy']}
    - Environment End Score: {engine_results['final_scores']['environment']}
    - Mobility End Score: {engine_results['final_scores']['mobility']}
    - Equity End Score: {engine_results['final_scores']['equity']}
    - Health End Score: {engine_results['final_scores']['health']}

    Review the details and calculate your sector's response. Return your response in the specified JSON structure.
    """


def compile_bundled_user_prompt(city_name: str, city_stats: dict, policy_names: list, all_parameters: dict, engine_results: dict, synergies_conflicts: list) -> str:
    """
    Constructs input context for the agent evaluating a multi-policy bundle.
    """
    policies_str = ", ".join(policy_names)
    syn_str = "\n".join([f"- [{item['type'].upper()}] {item['title']}: {item['description']}" for item in synergies_conflicts]) if synergies_conflicts else "None detected"

    return f"""
    City Context:
    - Name: {city_name}
    - Population: {city_stats.get('population')}
    - Median Income: ${city_stats.get('median_income')}/yr
    - Transit Share: {city_stats.get('transit_share')}%
    - Municipal Budget: ${city_stats.get('municipal_budget')}M/yr
    - AQI Baseline: {city_stats.get('aqi_baseline')}

    Proposed Policy Bundle:
    - Combined Policies: {policies_str}
    - All Applied Parameters: {all_parameters}

    Quantitative Calculations (Joint Simulation Projections):
    - Economy End Score: {engine_results['final_scores']['economy']}
    - Environment End Score: {engine_results['final_scores']['environment']}
    - Mobility End Score: {engine_results['final_scores']['mobility']}
    - Equity End Score: {engine_results['final_scores']['equity']}
    - Health End Score: {engine_results['final_scores']['health']}

    Detected Interaction Dynamics (Synergies & Conflicts):
    {syn_str}

    Review the joint package impact and return your sector's response in the specified JSON structure.
    """


def compile_meta_user_prompt(city_name: str, city_stats: dict, policy_name: str, parameters: dict, engine_results: dict, advisor_reports: list) -> str:
    """
    Constructs input context for the Meta-Decision Agent combining city data, quantitative projections, and all 6 advisor reports.
    """
    reports_formatted = []
    for rep in advisor_reports:
        reports_formatted.append(
            f"- {rep['agent_name'].upper()} Advisor (Score: {rep['score']}/100, Sentiment: {rep['sentiment']}):\n"
            f"  Statement: \"{rep['transcript']}\"\n"
            f"  Risks: {', '.join(rep.get('risks', []))}\n"
            f"  Mitigations: {', '.join(rep.get('mitigations', []))}"
        )
    
    reports_str = "\n\n".join(reports_formatted)
    
    return f"""
    City Context:
    - Name: {city_name}
    - Population: {city_stats.get('population')}
    - Median Income: ${city_stats.get('median_income')}/yr
    - Transit Share: {city_stats.get('transit_share')}%
    - Municipal Budget: ${city_stats.get('municipal_budget')}M/yr
    - AQI Baseline: {city_stats.get('aqi_baseline')}

    Proposed Policy Package:
    - Policy Name: {policy_name}
    - Parameters Applied: {parameters}

    Quantitative Calculations (Sector End Scores 0-100):
    - Economy: {engine_results['final_scores']['economy']}
    - Environment: {engine_results['final_scores']['environment']}
    - Mobility: {engine_results['final_scores']['mobility']}
    - Equity: {engine_results['final_scores']['equity']}
    - Health: {engine_results['final_scores']['health']}

    Deliberations from 6 Specialized Advisors:
    {reports_str}

    SYNTHESIS TASK:
    1. Collect recommendations, risks, and scores from each advisor.
    2. Identify consensus points and conflicts between sectors.
    3. Apply weighted scoring across Economy, Environment, Mobility, Equity, Health.
    4. Propose clear compromises to resolve sector conflicts.
    5. Output:
       • Executive summary message (plain language)
       • Final decision ('approve', 'reject', 'modify', 'bundle')
       • Confidence score (float 0.0 to 1.0, e.g. 0.85)
       • Justification referencing each advisor persona (Eva, Atlas, Gaia, Hygeia, Sophia, Prometheus)
       • Alternative pathways if consensus is weak

    Return strict JSON response as specified.
    """
