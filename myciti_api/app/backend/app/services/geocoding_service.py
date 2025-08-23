from geopy.geocoders import Nominatim
from typing import Optional, Tuple
import asyncio
import concurrent.futures

class GeocodingService:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="ridewise-myciti")

    async def geocode_location(self, location: str) -> Optional[Tuple[float, float]]:
        loop = asyncio.get_event_loop()
        try:
            location_object = await loop.run_in_executor(None, self.geolocator.geocode, location + ", Cape Town")
            if location_object:
                return (location_object.latitude, location_object.longitude)
        except Exception:
            return None


def get_geocoding_service() -> GeocodingService:
    return GeocodingService()
