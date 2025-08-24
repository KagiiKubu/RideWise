from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import googlemaps
from datetime import datetime
import random

# Google Maps client
gmaps = googlemaps.Client(key="AIzaSyCy2ID6lRuye-V6aCiwO8Rm_Js6Qd-WDy0")

app = FastAPI(title="Uber Estimator API")

# Model for JSON requests
class RideRequest(BaseModel):
    pickup_address: str
    drop_address: str

# Fare settings
BASE_FARES = {
    "UberX": 10,
    "UberXL": 15,
    "UberVan": 20
}

PER_KM_RATES = {
    "UberX": 5,
    "UberXL": 7,
    "UberVan": 10
}

WAIT_TIMES_RANGE = {
    "UberX": (2, 5),
    "UberXL": (4, 7),
    "UberVan": (7, 12)
}

MIN_FARES = {
    "UberX": 25,
    "UberXL": 35,
    "UberVan": 50
}

# Calculate estimate pricing
def calculate_uber_mock(distance_km: float, travel_time_min: float, ride_type: str) -> float:
    if ride_type not in BASE_FARES:
        raise ValueError("Invalid ride type")

    price = (
        BASE_FARES[ride_type]
        + PER_KM_RATES[ride_type] * distance_km
        + 0.5 * travel_time_min
    )
    
    return round(max(price, MIN_FARES[ride_type]), 2)

# Get travel distance & time from Google Maps
def get_distance_and_time(pickup, dropoff):
    try:
        now = datetime.now()
        directions_result = gmaps.directions(
            pickup,
            dropoff,
            mode="driving",
            departure_time=now
        )

        leg = directions_result[0]['legs'][0]
        distance_km = leg['distance']['value'] / 1000  # meters → km
        travel_time_min = leg['duration']['value'] / 60  # seconds → minutes
        travel_time_text = leg['duration']['text']

        return distance_km, travel_time_min, travel_time_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting travel data: {e}")

# Endpoint
@app.post("/estimate")
def estimate_ride(request: RideRequest):
    distance_km, travel_time_min, travel_time_text = get_distance_and_time(
        request.pickup_address, request.drop_address
    )

    rides = []
    for ride_type in BASE_FARES.keys():
        price = calculate_uber_mock(distance_km, travel_time_min, ride_type)
        wait_time_min = random.randint(*WAIT_TIMES_RANGE[ride_type])
        rides.append({
            "ride_type": ride_type,
            "price": price,
            "wait_time": f"{wait_time_min} min",
            "travel_time": travel_time_text
        })

    return {
        "pickup": request.pickup_address,
        "dropoff": request.drop_address,
        "distance_km": round(distance_km, 2),
        "rides": rides
    }
