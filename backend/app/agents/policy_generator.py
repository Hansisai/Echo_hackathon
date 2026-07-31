import hashlib
import json
import logging
import re

from google import genai
from google.genai import types
from backend.app.config import settings

logger = logging.getLogger("living_policy")

GENERATOR_SYSTEM_PROMPT = """
You are a policy design engine for a city-scale "Living Policy Simulator". Given a short,
free-text description of a municipal policy idea, invent a simulate-able policy module for it.

You MUST output strict JSON (no markdown fences, no commentary) with exactly these keys:
{
  "id_slug": "2-4 word snake_case id, unique-sounding, based on the idea",
  "name": "Human-readable policy name, Title Case, <= 50 characters",
  "description": "1-2 sentence explanation of the policy mechanism, <= 220 characters",
  "params": [
    {
      "key": "snake_case_key",
      "label": "Human readable slider label",
      "min": <number>,
      "max": <number>,
      "default": <number>,
      "step": <number>,
      "unit": "short unit e.g. $, %, days/week, $/ton"
    }
    // exactly 1 or 2 tunable parameters total
  ],
  "coefficients": {
    "economy": {"<param_key>": <float weight per 1 unit of param>, ...},
    "environment": {"<param_key>": <float>, ...},
    "mobility": {"<param_key>": <float>, ...},
    "equity": {"<param_key>": <float>, ...},
    "health": {"<param_key>": <float>, ...}
  },
  "impact_levers": ["short downstream-effect phrase", "... 4 to 6 total, each < 45 characters"]
}

Guidance:
- Weights are score-point deltas (0-100 scale) per 1 unit of the parameter at its default value; keep them realistic,
  typically between -1.5 and 1.5, so the policy produces a believable MIX of tradeoffs across sectors rather than
  being purely positive or purely negative everywhere.
- Every one of the 5 sectors (economy, environment, mobility, equity, health) must have an entry for every param key,
  even if the weight is 0.
- impact_levers should read like causal-graph node labels (e.g. "Traffic volume drop", "Municipal revenue gain").
"""

_SLUG_RE = re.compile(r"[^a-z0-9_]+")

def _slugify(text: str) -> str:
    slug = text.strip().lower().replace(" ", "_").replace("-", "_")
    slug = _SLUG_RE.sub("", slug)
    return slug[:40] or "custom_policy"

def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))

def _mock_generate_policy(prompt: str) -> dict:
    """
    Deterministic, dependency-free fallback used when no GEMINI_API_KEY is configured or the
    API call fails. Uses keyword heuristics + a stable hash of the prompt so the same idea
    always yields the same (but still prompt-specific) policy module.
    """
    text = prompt.lower()
    digest = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    # Stable pseudo-random floats in [-1, 1] derived from the hash, used to add variety
    jitter = [((int(digest[i:i+2], 16) / 255.0) * 2 - 1) for i in range(0, 16, 2)]

    # Keyword-driven directional bias per sector: positive means the idea likely helps that sector
    bias = {"economy": 0.0, "environment": 0.0, "mobility": 0.0, "equity": 0.0, "health": 0.0}

    fee_words = ["tax", "fee", "toll", "charge", "levy", "fine", "penalty"]
    subsidy_words = ["subsidy", "subsidize", "free", "fund", "grant", "incentive", "rebate"]
    green_words = ["tree", "green", "park", "canopy", "solar", "renewable", "clean", "carbon", "emission"]
    transit_words = ["bus", "metro", "transit", "train", "bike", "cycling", "pedestrian", "walk", "rail"]
    equity_words = ["low-income", "equity", "affordable", "accessib", "poverty", "welfare"]
    vehicle_words = ["car", "vehicle", "road", "highway", "parking", "traffic"]

    def has_any(words):
        return any(w in text for w in words)

    if has_any(fee_words):
        bias["economy"] -= 0.4
        bias["equity"] -= 0.5
        bias["mobility"] += 0.5
        bias["environment"] += 0.4
    if has_any(subsidy_words):
        bias["economy"] -= 0.3
        bias["equity"] += 0.6
        bias["mobility"] += 0.4
    if has_any(green_words):
        bias["environment"] += 0.7
        bias["health"] += 0.5
        bias["economy"] -= 0.15
    if has_any(transit_words):
        bias["mobility"] += 0.6
        bias["environment"] += 0.3
        bias["health"] += 0.2
    if has_any(equity_words):
        bias["equity"] += 0.6
    if has_any(vehicle_words) and not has_any(transit_words):
        bias["mobility"] += 0.3
        bias["environment"] -= 0.1

    # If nothing matched, fall back to mild positive-everywhere-but-cost civic policy
    if not any(has_any(w) for w in [fee_words, subsidy_words, green_words, transit_words, equity_words, vehicle_words]):
        bias = {"economy": -0.1, "environment": 0.3, "mobility": 0.3, "equity": 0.2, "health": 0.2}

    slug_base = "_".join(re.findall(r"[a-zA-Z]+", prompt.lower())[:4]) or "custom_policy"
    id_slug = _slugify(slug_base)

    name = prompt.strip().rstrip(".!?")
    name = (name[0].upper() + name[1:]) if name else "Custom Policy Initiative"
    if len(name) > 50:
        name = name[:47] + "..."

    description = f"An AI auto-generated policy module simulating: \"{prompt.strip()}\". Tune the sliders to explore how intensity and investment shift city-wide outcomes."
    if len(description) > 220:
        description = description[:217] + "..."

    params = [
        {"key": "intensity", "label": "Policy Intensity", "min": 0.0, "max": 100.0, "default": 30.0, "step": 1.0, "unit": "%"},
        {"key": "budget_m", "label": "Annual Program Budget", "min": 1.0, "max": 50.0, "default": 10.0, "step": 1.0, "unit": "$M"},
    ]

    coefficients = {}
    for si, sector in enumerate(["economy", "environment", "mobility", "equity", "health"]):
        b = bias[sector]
        intensity_weight = round(_clamp(b * 0.6 + jitter[si] * 0.15, -1.5, 1.5), 3)
        budget_weight = round(_clamp(b * 0.4 + jitter[si + 3] * 0.1, -1.5, 1.5), 3)
        # Budget almost always has a mild economy cost unless the idea is explicitly a fee/tax (revenue generating)
        if sector == "economy" and not has_any(fee_words):
            budget_weight = round(_clamp(budget_weight - 0.15, -1.5, 1.5), 3)
        coefficients[sector] = {"intensity": intensity_weight, "budget_m": budget_weight}

    impact_levers = [
        "Public awareness & adoption",
        "Municipal budget allocation",
        "Behavior shift among residents",
        "Downstream service demand",
    ]
    if has_any(green_words):
        impact_levers = ["Green coverage growth", "Local air quality", "Community wellbeing", "Land value shift"]
    elif has_any(fee_words):
        impact_levers = ["Revenue collected", "Behavior deterrence", "Compliance cost", "Equity impact"]
    elif has_any(transit_words):
        impact_levers = ["Ridership growth", "Road congestion", "Emissions reduction", "Access equity"]
    elif has_any(subsidy_words):
        impact_levers = ["Uptake rate", "Budget drawdown", "Household savings", "Long-term sustainability"]

    return {
        "id_slug": id_slug,
        "name": name,
        "description": description,
        "params": params,
        "coefficients": coefficients,
        "impact_levers": impact_levers,
    }

def generate_policy(prompt: str) -> dict:
    """
    Turns a free-text policy idea into a fully simulate-able policy definition.
    Tries Gemini first (structured JSON output); falls back to a deterministic
    heuristic generator if no API key is configured or the call fails/parses badly.
    """
    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"Policy idea: {prompt.strip()}\n\nGenerate the JSON as specified.",
                config=types.GenerateContentConfig(
                    system_instruction=GENERATOR_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.8
                )
            )
            text = response.text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1]) if lines[0].startswith("```") else text
            parsed = json.loads(text.strip())

            # Basic shape validation; fall through to mock on anything malformed
            assert parsed.get("params") and 1 <= len(parsed["params"]) <= 2
            assert parsed.get("coefficients")
            for p in parsed["params"]:
                for field in ["key", "label", "min", "max", "default", "step", "unit"]:
                    assert field in p

            parsed["id_slug"] = _slugify(parsed.get("id_slug") or parsed.get("name", "custom_policy"))
            return parsed
        except Exception as e:
            logger.warning(f"AI policy generation via Gemini failed: {e}. Falling back to heuristic generator.")

    return _mock_generate_policy(prompt)
