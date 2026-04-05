"""
app/routers/spatial.py
Spatial hotspot detection endpoints.
"""
from fastapi import APIRouter
from app.core import load_df, STATION_COORDS, ZONE_TYPES, aqi_label

router = APIRouter()


@router.get("/hotspots")
def get_hotspots():
    df = load_df()
    hotspot = (
        df.groupby("Station")["PM2_5_AQI"]
        .agg(mean="mean", std="std", max="max", min="min")
        .round(2)
        .reset_index()
        .sort_values("mean", ascending=False)
    )
    result = []
    for _, row in hotspot.iterrows():
        s = row["Station"]
        result.append({
            "station":   s,
            "mean_aqi":  round(float(row["mean"]), 2),
            "std_aqi":   round(float(row["std"]),  2),
            "max_aqi":   round(float(row["max"]),  1),
            "min_aqi":   round(float(row["min"]),  1),
            "lat":       STATION_COORDS.get(s, [0, 0])[0],
            "lon":       STATION_COORDS.get(s, [0, 0])[1],
            "zone":      ZONE_TYPES.get(s, "Mixed"),
            "aqi_label": aqi_label(row["mean"]),
        })
    return result


@router.get("/pollutant-profile/{station}")
def get_pollutant_profile(station: str):
    df = load_df()
    sdf = df[df["Station"] == station]
    if sdf.empty:
        return {"error": "Station not found"}
    cols = ["PM2_5", "PM10", "NO2", "SO2", "CO", "Ozone", "NH3"]
    means = sdf[cols].mean().round(3)
    return {"station": station, "profile": means.to_dict()}


@router.get("/stations")
def get_stations():
    df = load_df()
    return {"stations": sorted(df["Station"].unique().tolist())}
