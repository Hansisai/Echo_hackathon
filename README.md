# 🏙️ Living Policy Simulator & Civic Transparency Portal

An advanced, AI-powered multi-agent policy simulation platform designed for city councils, urban planners, and citizens. The **Living Policy Simulator** models complex socio-economic-environmental urban dynamics, detects multi-policy synergies/conflicts, synthesizes deliberations across 7 specialized virtual AI advisors, and translates technical public policies into transparent, accessible infographics with voice narration.

---

## 🌟 Key Features

### 1. 📊 5-Sector Mathematical Policy Engine
- Calculates quantitative projections across 5 core municipal indices over a 5-year timeline:
  - **Economy** (Local commerce, municipal revenue, business costs)
  - **Environment** (CO2 emissions, air quality AQI, green canopy)
  - **Mobility** (Transit ridership share, vehicular congestion index)
  - **Equity** (Cost of living, low-income burden, accessibility)
  - **Health** (Respiratory admissions, physical activity, commuter stress)
- Models dynamic cross-sector feedback loops and non-linear decay curves.

### 2. 🤖 7 Virtual AI Advisors (Multi-Agent Deliberation)
- **Eva** — Chief Economic Analyst
- **Atlas** — Transit & Infrastructure Director
- **Gaia** — Environmental Safeguard Commissioner
- **Hygeia** — Public Health Commissioner
- **Sophia** — Social Equity & Citizen Welfare Advocate
- **Prometheus** — Smart Grid & Utilities Architect
- **Athena** — **Chief Meta-Decision & Synthesis Executive**:
  - Reviews outputs from all 6 sector advisors.
  - Identifies consensus points and inter-sectoral conflicts.
  - Applies weighted scoring and formulates a final decision (*Approve, Reject, Modify, Bundle*).
  - Assigns a confidence score (0–100%) and outlines alternative strategic pathways.

### 3. ⚡ Multi-Policy Bundling & Synergy Engine
- Interactively test multi-policy combinations (e.g. *Congestion Toll + Metro Fare Subsidy*).
- Automatic detection of **Positive Synergies** (e.g., +15% mobility boost) and **Negative Conflicts** (e.g., doubled low-income cost strain).
- Interactive combined **Directed Acyclic Graph (DAG)** showing causal ripple effects across urban systems.

### 4. 📢 Civic Transparency Digest
- Infographic policy cards designed for citizens, explaining policy purpose, mechanisms, advantages, and risks in plain, non-technical language.
- **Multilingual Support**: Switch seamlessly between English, Spanish, French, and Hindi.
- **Voice Narration**: Native Web Speech API text-to-speech for hands-free audio listening.
- **Status Filtering**: Filter by Active Policies vs. Historical Expired Policy Archive.

### 5. 📑 Executive Reports & Multi-Format Exports
- One-click export of complete executive HTML simulation reports.
- Export detailed 5-year sector projections as raw CSV datasets for spreadsheet modeling.
- Comprehensive report history registry.

### 6. 🎨 Dual-Theme Support (Dark & Light Mode)
- Built with a glassmorphism design system.
- Includes a 1-click **Light Mode / Dark Mode** theme switcher with persistent local storage.

---

## 🛠️ Architecture & Tech Stack

```
   ┌────────────────────────────────────────────────────────┐
   │                     React 18 + Vite                    │
   │      (Glassmorphic UI, Radar/Line Charts, DAG Graphs)  │
   └───────────────────────────┬────────────────────────────┘
                               │ REST API (JSON)
   ┌───────────────────────────▼────────────────────────────┐
   │                    FastAPI Backend                     │
   │  (Policy Engine, Multi-Agent Manager, Synergy Engine)  │
   └───────────────┬────────────────────────┬───────────────┘
                   │                        │
   ┌───────────────▼────────┐      ┌────────▼───────────────┐
   │   SQLite Database      │      │  Featherless AI /      │
   │  (Cities, Policies)    │      │  Google Gemini LLM     │
   └────────────────────────┘      └────────────────────────┘
```

- **Backend**: FastAPI, Python 3.13, SQLite, SQLAlchemy, Pydantic
- **AI Inference**: Featherless AI (`meta-llama/Meta-Llama-3.1-8B-Instruct`) with Google Gemini fallback and realistic mock fallback
- **Frontend**: React, Vite, Lucide Icons, Web Speech API, Vanilla CSS Design System

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & `npm`

---

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/Hansisai/Echo_hackathon.git
cd Echo_hackathon

# (Optional) Create virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install fastapi uvicorn sqlalchemy pydantic google-genai

# Set API Key (Optional: Featherless AI or Gemini)
# On Windows PowerShell:
$env:FEATHERLESS_API_KEY="your_api_key_here"

# Run FastAPI backend dev server
uvicorn backend.app.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000`  
Swagger API Documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend Web App will be live at: `http://localhost:5173`

---

## 🛰️ Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cities` | List all available baseline cities |
| `GET` | `/api/policies` | List active simulation policies |
| `GET` | `/api/policies/digest?status=all` | Retrieve citizen policy digest cards |
| `POST` | `/api/simulations/run` | Execute single-policy 5-year simulation |
| `POST` | `/api/simulations/run-bundle` | Execute multi-policy joint simulation with synergy engine |
| `GET` | `/api/simulations/history` | Retrieve historic simulation runs |
| `GET` | `/api/simulations/{id}/export?format=html` | Export executive HTML or CSV report |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
