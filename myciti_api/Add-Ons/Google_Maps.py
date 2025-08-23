from fastapi import FastAPI, Query, HTTPException
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import requests
from datetime import datetime
import pytz
import logging

app = FastAPI()

# Setup geocoder
geolocator = Nominatim(user_agent="ridewise-myciti")

# MyCiTi bus stops URL (GeoJSON)
MYCITI_URL = "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/ODP_SPLIT_6/FeatureServer/10/query?where=1%3D1&outFields=*&f=geojson"

# Load bus stops with error handling
try:
    response = requests.get(MYCITI_URL)
    response.raise_for_status()
    bus_stops = response.json()["features"]
except Exception as e:
    logging.error("Failed to fetch MyCiTi bus stop data: %s", e)
    bus_stops = []

# Google Maps Directions API key placeholder
GOOGLE_MAPS_API_KEY = "OUR_API_KEY"

# Find nearest MyCiTi stop to a location string
def find_nearest_stop(location: str):
    user_loc = geolocator.geocode(location + ", Cape Town")
    if not user_loc:
        return None, None

    user_point = (user_loc.latitude, user_loc.longitude)

    nearest = min(
        bus_stops,
        key=lambda stop: geodesic(
            (stop["geometry"]["coordinates"][1], stop["geometry"]["coordinates"][0]),
            user_point
        ).meters
    )

    stop_name = nearest["properties"]["STOP_NAME"]
    stop_distance = geodesic(
        (nearest["geometry"]["coordinates"][1], nearest["geometry"]["coordinates"][0]),
        user_point
    ).meters

    return stop_name, round(stop_distance, 1)

# Check if current time is peak
def is_peak_time(now: datetime):
    if now.weekday() >= 5:  # Weekend
        return False
    
    morning_peak_start = now.replace(hour=6, minute=45, second=0, microsecond=0)
    morning_peak_end = now.replace(hour=8, minute=0, second=0, microsecond=0)
    evening_peak_start = now.replace(hour=16, minute=15, second=0, microsecond=0)
    evening_peak_end = now.replace(hour=17, minute=30, second=0, microsecond=0)

    return (morning_peak_start <= now <= morning_peak_end) or (evening_peak_start <= now <= evening_peak_end)

# Fare calculation based on distance and peak time
def get_fare(distance_km: float, peak: bool):
    bands = [
        (5, 13.50, 10.50),
        (10, 18.50, 13.50),
        (20, 23.50, 18.50),
        (30, 25.50, 21.50),
        (40, 27.50, 23.50),
        (50, 31.50, 28.50),
        (60, 36.50, 31.50),
        (float("inf"), 39.50, 33.50)
    ]
    for max_dist, peak_fare, saver_fare in bands:
        if distance_km <= max_dist:
            return round(peak_fare if peak else saver_fare, 2)

# --- zTrip info endpoint ---
@app.get("/trip-info/")
def get_trip_info(start: str = Query(...), end: str = Query(...)):
    start_stop, start_dist = find_nearest_stop(start)
    end_stop, end_dist = find_nearest_stop(end)

    if not start_stop or not end_stop:
        raise HTTPException(status_code=400, detail="Could not geocode one or both locations.")

    user_start = geolocator.geocode(start + ", Cape Town")
    user_end = geolocator.geocode(end + ", Cape Town")

    user_start_coords = (user_start.latitude, user_start.longitude)
    user_end_coords = (user_end.latitude, user_end.longitude)

    trip_distance_km = geodesic(user_start_coords, user_end_coords).km

    now = datetime.now(pytz.timezone("Africa/Johannesburg"))
    peak = is_peak_time(now)

    fare = get_fare(trip_distance_km, peak)

    return {
        "start": {
            "address": start,
            "coordinates": [user_start.latitude, user_start.longitude],
            "nearest_stop": start_stop,
            "distance_meters": start_dist
        },
        "end": {
            "address": end,
            "coordinates": [user_end.latitude, user_end.longitude],
            "nearest_stop": end_stop,
            "distance_meters": end_dist
        },
        "trip_distance_km": round(trip_distance_km, 2),
        "is_peak_time": peak,
        "fare": f"R{fare:.2f}"
    }

# --- Route endpoint using Google Maps Directions API ---
@app.get("/route/")
def get_route(start: str = Query(...), end: str = Query(...)):
    if not GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY == "OUR_API_KEY":
        raise HTTPException(status_code=500, detail="Google Maps API key not set")

    endpoint = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": start + ", Cape Town",
        "destination": end + ", Cape Town",
        "mode": "transit",
        "transit_mode": "bus",
        "key": GOOGLE_MAPS_API_KEY
    }

    resp = requests.get(endpoint, params=params)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Error calling Google Maps Directions API")

    data = resp.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=400, detail=f"Google Maps API error: {data.get('error_message', data['status'])}")

    route = data["routes"][0]
    leg = route["legs"][0]

    steps = []
    for step in leg["steps"]:
        steps.append({
            "instruction": step.get("html_instructions", ""),
            "travel_mode": step.get("travel_mode", ""),
            "distance": step["distance"]["text"],
            "duration": step["duration"]["text"],
            "transit_details": step.get("transit_details", None)
        })

    return {
        "start_address": leg["start_address"],
        "end_address": leg["end_address"],
        "distance": leg["distance"]["text"],
        "duration": leg["duration"]["text"],
        "steps": steps
    }


## FastAPIs
# /trip-info/?start=40 Church Street, Woodstock&end=Table View
# /route/?start=40 Church Street, Woodstock&end=Table View
