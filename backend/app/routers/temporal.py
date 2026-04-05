"""
app/routers/temporal.py
Seasonal, yearly, and weekday-weekend temporal decomposition.
"""
from fastapi import APIRouter
from app.core import load_df, MONTH_NAMES

router = APIRouter()


@router.get("/seasonal")
def get_seasonal():
    df = load_df()
    monthly = (
        df.groupby("Month")["PM2_5_AQI"]
        .mean()
        .round(2)
        .reset_index()
    )
    monthly["month_name"] = monthly["Month"].apply(lambda x: MONTH_NAMES[x - 1])
    return monthly.to_dict(orient="records")


@router.get("/seasonal/{station}")
def get_seasonal_station(station: str):
    df = load_df()
    sdf = df[df["Station"] == station]
    monthly = (
        sdf.groupby("Month")["PM2_5_AQI"]
        .mean()
        .round(2)
        .reset_index()
    )
    monthly["month_name"] = monthly["Month"].apply(lambda x: MONTH_NAMES[x - 1])
    return monthly.to_dict(orient="records")


@router.get("/yearly")
def get_yearly():
    df = load_df()
    yearly = (
        df.groupby(["Year", "Station"])["PM2_5_AQI"]
        .mean()
        .round(2)
        .reset_index()
    )
    yearly.columns = ["year", "station", "mean_aqi"]
    return yearly.to_dict(orient="records")


@router.get("/weekly")
def get_weekly():
    df = load_df()
    order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = (
        df.groupby("DayName")["PM2_5_AQI"]
        .mean()
        .round(2)
        .reset_index()
    )
    weekly.columns = ["day", "mean_aqi"]
    weekly["order"] = weekly["day"].map({d: i for i, d in enumerate(order)})
    weekly = weekly.sort_values("order").drop(columns="order")

    weekday_avg = weekly[~weekly["day"].isin(["Sat", "Sun"])]["mean_aqi"].mean()
    weekend_avg = weekly[weekly["day"].isin(["Sat", "Sun"])]["mean_aqi"].mean()
    return {
        "data":         weekly.to_dict(orient="records"),
        "weekday_avg":  round(float(weekday_avg), 2),
        "weekend_avg":  round(float(weekend_avg), 2),
        "delta":        round(float(weekday_avg - weekend_avg), 2),
    }
