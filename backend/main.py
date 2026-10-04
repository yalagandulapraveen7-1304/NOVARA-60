"""
NOVARA | Antarctic Digital Twin - Backend Application Server
Supports remote operations and digital twin simulation for India's Antarctic
research stations, Maitri and Bharati (MoES / NCPOR).

NOTE: Operates in SIMULATION MODE with deterministic electro-thermal physics models.
Does not claim live SCADA sensor feeds from physical Antarctic installations.
"""
import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.database.service import db_service
from backend.routers.station_router import router as station_router
from backend.routers.telemetry_router import router as telemetry_router
from backend.routers.energy_router import router as energy_router
from backend.routers.environment_router import router as environment_router
from backend.routers.logistics_router import router as logistics_router
from backend.routers.alerts_router import router as alerts_router
from backend.routers.simulation_router import router as simulation_router
from backend.routers.settings_router import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    # Ensure SQLite database schema and seed data are ready
    db_service.initialize()
    yield


app = FastAPI(
    title="NOVARA | Antarctic Digital Twin API",
    description=(
        "Mission-control API for India's Antarctic Research Stations (Maitri & Bharati). "
        "Provides microgrid dispatch, AWS synoptic telemetry, logistics tracking, "
        "and fault simulation under deterministic polar models. "
        "Organizational Context: Ministry of Earth Sciences (MoES) & National Centre for Polar and Ocean Research (NCPOR)."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Cross-Origin Resource Sharing (CORS) Configuration
# Supports local development, custom production domains, and dynamic Vercel / Render URLs
raw_cors = os.environ.get("CORS_ORIGINS", "")
custom_origins = [o.strip() for o in raw_cors.split(",") if o.strip()]

default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
]

allowed_origins = list(set(default_origins + custom_origins))

if "*" in custom_origins or raw_cors.strip() == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"^https?:\/\/.*(\.vercel\.app|\.onrender\.com)(:\d+)?$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

# Mount Modular Routers
app.include_router(station_router)
app.include_router(telemetry_router)
app.include_router(energy_router)
app.include_router(environment_router)
app.include_router(logistics_router)
app.include_router(alerts_router)
app.include_router(simulation_router)
app.include_router(settings_router)


# Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "simulation_mode": "SIMULATION_MODE",
            "message": "Input validation failed. Please check your request parameters.",
            "errors": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "simulation_mode": "SIMULATION_MODE",
            "message": f"Internal server error: {str(exc)}"
        }
    )


# System & Health Endpoints
@app.get("/", tags=["System"])
def root():
    """System banner and high-level platform status."""
    return {
        "platform": "NOVARA | ANTARCTIC DIGITAL TWIN",
        "version": "2.0.0",
        "status": "ONLINE",
        "mode": "SIMULATION MODE",
        "organization": "Ministry of Earth Sciences (MoES) / NCPOR",
        "stations": ["maitri", "bharati"],
        "docs": "/docs",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint for container orchestrators and frontend monitor."""
    return {
        "status": "healthy",
        "simulation_engine": "active",
        "database": "sqlite_wal_mode",
        "mode": "SIMULATION MODE"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
