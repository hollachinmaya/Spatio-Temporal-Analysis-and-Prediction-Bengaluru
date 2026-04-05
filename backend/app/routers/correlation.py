"""
app/routers/correlation.py
Inter-station Pearson correlation matrix.
"""
from fastapi import APIRouter
from app.core import load_df

router = APIRouter()


@router.get("/matrix")
def get_correlation_matrix():
    df = load_df()
    pivot = df.pivot_table(
        values="PM2_5_AQI",
        index="Timestamp",
        columns="Station",
        aggfunc="mean",
    )
    corr = pivot.corr().round(3)
    stations = corr.columns.tolist()

    # Build flat list of {station1, station2, value}
    pairs = []
    for s1 in stations:
        for s2 in stations:
            val = corr.loc[s1, s2]
            if not (val != val):  # skip NaN
                pairs.append({"station1": s1, "station2": s2, "value": round(float(val), 3)})

    # Average correlation per station (excluding self)
    avg_corr = []
    for s in stations:
        others = [p["value"] for p in pairs if p["station1"] == s and p["station2"] != s]
        if others:
            avg_corr.append({"station": s, "avg_r": round(sum(others) / len(others), 3)})

    overall_avg = round(
        sum(p["avg_r"] for p in avg_corr) / len(avg_corr), 3
    ) if avg_corr else 0

    return {
        "stations":    stations,
        "pairs":       pairs,
        "avg_per_station": avg_corr,
        "overall_avg": overall_avg,
    }
