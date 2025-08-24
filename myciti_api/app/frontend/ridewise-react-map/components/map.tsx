import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import Places from "./places";
import Distance from "./distance";
import TrainRide from "./TrainRide";
import EHailingRide from "./EHailingRide";
import MyCitiBusRide from "./MyCitiBusRide";

type LatLngLiteral = google.maps.LatLngLiteral;
type DirectionsResult = google.maps.DirectionsResult;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  const mapRef = useRef<google.maps.Map | null>(null);

  // Coordinates for markers
  const [location, setLocation] = useState<LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<LatLngLiteral | null>(null);

  // Addresses for ride calculations
  const [startAddress, setStartAddress] = useState<string | null>(null);
  const [endAddress, setEndAddress] = useState<string | null>(null);

  const [directions, setDirections] = useState<DirectionsResult | null>(null);

  // Get user geolocation on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        mapRef.current?.panTo(loc);
      });
    }
  }, []);

  const center = useMemo<LatLngLiteral>(() => location || { lat: 43.45, lng: -80.49 }, [location]);

  const options = useMemo<MapOptions>(() => ({
    mapId: "b181cac70f27f5e6",
  }), []);

  const onLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);

  // Compute directions when location or destination changes
  const fetchDirections = useCallback(() => {
    if (!location || !destination) return;
    const service = new google.maps.DirectionsService();
    service.route({
      origin: location,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === "OK" && result) setDirections(result);
    });
  }, [location, destination]);

  useEffect(() => { fetchDirections(); }, [fetchDirections]);

  return (
    <div className="container">
      <div className="controls" style={{ backgroundColor: "#FE854F" }}>
        <h1>RideWise</h1>

        {/* Location search */}
        <Places label="Location" setPosition={(pos) => {
          setLocation(pos.latLng);
          setStartAddress(pos.address);
        }} />

        {/* Destination search */}
        <Places label="Destination" setPosition={(pos) => {
          setDestination(pos.latLng);
          setEndAddress(pos.address);
        }} />

        {!destination && <p>Enter your destination address.</p>}
        {directions && <Distance leg={directions.routes[0].legs[0]} />}

        {/* Reset map button */}
        {location && (
          <button
            onClick={() => {
              mapRef.current?.panTo(location);
              setDestination(null);
              setDirections(null);
              setEndAddress(null);
            }}
            style={{ marginTop: "10px", padding: "6px 12px", cursor: "pointer" }}
          >
            Reset Map
          </button>
        )}

        {/* Ride comparison cards */}
        {startAddress && endAddress && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
            <TrainRide startAddress={startAddress} endAddress={endAddress} />
            <EHailingRide duration="25 min" cost="R60" />
            <MyCitiBusRide duration="40 min" cost="R15" />
          </div>
        )}
      </div>

      <div className="map">
        <GoogleMap
          zoom={10}
          center={center}
          mapContainerClassName="map-container"
          options={options}
          onLoad={onLoad}
          onClick={(e) => {
            if (e.latLng) setDestination({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }}
        >
          {/* Red marker for user location */}
          {location && (
            <Marker
              position={location}
              icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
              title="Your location"
            />
          )}

          {/* Green marker for destination */}
          {destination && (
            <Marker
              position={destination}
              icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
              title="Destination"
            />
          )}

          {/* Route */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{ polylineOptions: { strokeColor: "#1976D2", strokeWeight: 5 } }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
