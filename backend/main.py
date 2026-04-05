from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import overview, spatial, temporal, correlation, prediction, timeseries

app = FastAPI(
    title="Bangalore AQI Intelligence API",
    description="Spatiotemporal Framework for Urban Air Quality Analysis and Prediction",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router,     prefix="/api/overview",     tags=["Overview"])
app.include_router(spatial.router,      prefix="/api/spatial",      tags=["Spatial"])
app.include_router(temporal.router,     prefix="/api/temporal",     tags=["Temporal"])
app.include_router(correlation.router,  prefix="/api/correlation",  tags=["Correlation"])
app.include_router(prediction.router,   prefix="/api/prediction",   tags=["Prediction"])
app.include_router(timeseries.router,   prefix="/api/timeseries",   tags=["TimeSeries"])

@app.get("/")
def root():
    return {"message": "Bangalore AQI Intelligence API", "status": "running"}

@app.get("/api/health")
def health():
    return {"status": "ok"}
