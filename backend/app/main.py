from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import init_db
from backend.app.api import cities, policies, simulations

app = FastAPI(
    title="Living Policy Simulator API",
    description="Backend decision engine and multi-agent simulation coordinator powered by Gemini & SQLite.",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain e.g. ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables and seed baseline metrics
@app.on_event("startup")
def startup_event():
    print("Initializing SQLite database...")
    init_db()
    print("Database ready.")

# Include sub-routers
app.include_router(cities.router, prefix="/api")
app.include_router(policies.router, prefix="/api")
app.include_router(simulations.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Living Policy Simulator API",
        "docs_url": "/docs"
    }
