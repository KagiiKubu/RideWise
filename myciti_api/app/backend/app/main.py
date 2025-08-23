from fastapi import FastAPI, Depends, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import pytz
from geopy.distance import geodesic

from app.services.stops_service import StopsService, get_stops_service
from app.services.geocoding_service import GeocodingService, get_geocoding_service

app = FastAPI(title="MyCiTi API")

# CORS origins
origins = [
    "http://localhost:3000",
    "http://localhost",
]
# Include the frontend URL for CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


def is_peak_time(now: datetime) -> bool:
    if now.weekday() >= 5:
        return False

    morning_start = now.replace(hour=6, minute=45, second=0, microsecond=0)
    morning_end = now.replace(hour=8, minute=0, second=0, microsecond=0)

    evening_start = now.replace(hour=16, minute=15, second=0, microsecond=0)
    evening_end = now.replace(hour=17, minute=30, second=0, microsecond=0)

    return (morning_start <= now <= morning_end) or (evening_start <= now <= evening_end)


def calculate_fare(distance_km: float, peak: bool) -> float:
    fare_bands = [
        (5, 13.50, 10.50),
        (10, 18.50, 13.50),
        (20, 23.50, 18.50),
        (30, 25.50, 21.50),
        (40, 27.50, 23.50),
        (50, 31.50, 28.50),
        (60, 36.50, 31.50),
        (float("inf"), 39.50, 33.50),
    ]

    # Finding the fare using distance and peak time
    for max_dist, peak_fare, saver_fare in fare_bands:
        if distance_km <= max_dist:
            return peak_fare if peak else saver_fare

    return fare_bands[-1][2] 

@app.get("/nearest-stops/")
async def get_nearest_stops_with_fare(
    start: str = Query(..., description="Start address"),
    end: str = Query(..., description="End address"),
    stops_service: StopsService = Depends(get_stops_service),
    geocoder: GeocodingService = Depends(get_geocoding_service),
):
    start_location = await geocoder.geocode_location(start)
    if not start_location:
        raise HTTPException(status_code=400, detail=f"Could not geocode start address: {start}")

    end_location = await geocoder.geocode_location(end)
    if not end_location:
        raise HTTPException(status_code=400, detail=f"Could not geocode end address: {end}")

    nearest_start_stop, start_distance = stops_service.find_nearest_stop(start_location)
    nearest_end_stop, end_distance = stops_service.find_nearest_stop(end_location)

    trip_distance_km = geodesic(start_location, end_location).km

    now = datetime.now(pytz.timezone("Africa/Johannesburg"))
    peak = is_peak_time(now)
    fare = calculate_fare(trip_distance_km, peak)

    return {
        "start": {
            "address": start,
            "coordinates": list(start_location),
            "nearest_stop": nearest_start_stop,
            "distance_meters": round(start_distance, 1),
        },
        "end": {
            "address": end,
            "coordinates": list(end_location),
            "nearest_stop": nearest_end_stop,
            "distance_meters": round(end_distance, 1),
        },
        "trip_distance_km": round(trip_distance_km, 2),
        "is_peak_time": peak,
        "fare_rands": round(fare, 2),
    }
