import requests
from typing import Tuple, Optional
from geopy.distance import geodesic
import logging

MYCITI_URL = (
    "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/ODP_SPLIT_6/"
    "FeatureServer/10/query?where=1%3D1&outFields=*&f=geojson"
)

class StopsService:
    def __init__(self):
        self.bus_stops = []
        self.load_bus_stops()

    def load_bus_stops(self):
        try:
            response = requests.get(MYCITI_URL)
            response.raise_for_status()
            data = response.json()
            self.bus_stops = data.get("features", [])
            logging.info(f"Loaded {len(self.bus_stops)} bus stops")
        except Exception as e:
            logging.error(f"Failed to fetch MyCiTi bus stop data: {e}")
            self.bus_stops = []

    def find_nearest_stop(self, coordinates: Tuple[float, float]) -> Tuple[Optional[str], Optional[float]]:
        if not self.bus_stops:
            return None, None

        user_point = coordinates

        nearest = min(
            self.bus_stops,
            key=lambda stop: geodesic(
                (stop["geometry"]["coordinates"][1], stop["geometry"]["coordinates"][0]),
                user_point,
            ).meters,
        )

        stop_name = nearest["properties"].get("STOP_NAME")
        stop_distance = geodesic(
            (nearest["geometry"]["coordinates"][1], nearest["geometry"]["coordinates"][0]), user_point
        ).meters

        return stop_name, stop_distance


def get_stops_service() -> StopsService:
    return StopsService()
