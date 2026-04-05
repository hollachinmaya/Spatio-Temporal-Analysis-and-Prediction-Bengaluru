"""
app/routers/overview.py
City-wide summary statistics endpoint.
"""
from fastapi import APIRouter
from app.core import load_df, STATION_COORDS, ZONE_TYPES, aqi_label

router = APIRouter()


@router.get("/stats")
def get_overview_stats():
    df = load_df()

    hotspot = (
        df.groupby("Station")["PM2_5_AQI"]
        .agg(mean="mean", std="std", max="max", min="min", count="count")
        .round(2)
        .reset_index()
        .sort_values("mean", ascending=False)
    )

    stations_data = []
    for _, row in hotspot.iterrows():
        s = row["Station"]
        coords = STATION_COORDS.get(s, [0, 0])
        stations_data.append({
            "station":    s,
            "mean_aqi":   round(float(row["mean"]), 2),
            "std_aqi":    round(float(row["std"]),  2),
            "max_aqi":    round(float(row["max"]),  1),
            "min_aqi":    round(float(row["min"]),  1),
            "count":      int(row["count"]),
            "lat":        coords[0],
            "lon":        coords[1],
            "zone":       ZONE_TYPES.get(s, "Mixed"),
            "aqi_label":  aqi_label(row["mean"]),
        })

    pollutants = (
        df.groupby("Station")[["PM2_5", "PM10", "NO2", "SO2", "CO", "Ozone"]]
        .mean()
        .round(2)
        .reset_index()
    )

    return {
        "total_records": int(len(df)),
        "stations":      int(df["Station"].nunique()),
        "date_range":    f"{df['Timestamp'].min().strftime('%b %Y')} – {df['Timestamp'].max().strftime('%b %Y')}",
        "avg_aqi":       round(float(df["PM2_5_AQI"].mean()), 1),
        "max_aqi":       round(float(df["PM2_5_AQI"].max()), 1),
        "worst_station": stations_data[0]["station"],
        "best_station":  stations_data[-1]["station"],
        "hotspot":       stations_data,
        "pollutants":    pollutants.to_dict(orient="records"),
    }
