import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, DirectionsRenderer, MarkerClusterer, Circle } from "@react-google-maps/api";
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

  // User location and destination
  const [location, setLocation] = useState<LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<LatLngLiteral | null>(null);
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
    // disableDefaultUI: true,
    // clickableIcons: false,
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

  // Optional houses for clustering
  // const houses = useMemo(() => location ? generateHouses(location) : [], [location]);

  return (
    <div className="container">
      <div className="controls" style={{
    backgroundColor: "⁠#FE854F"}}>
        <h1>RiseWise</h1>

        {/* User Location search */}
        <Places label="Location" setPosition={setLocation} />

        {/* Destination search */}
        <Places label="Destination" setPosition={setDestination} />

        {!destination && <p>Enter your destination address.</p>}

        {directions && <Distance leg={directions.routes[0].legs[0]} />}

        {/* Reset map button */}
        {location && (
          <button
            onClick={() => {
              mapRef.current?.panTo(location);
              setDestination(null);   // clear destination
              setDirections(null);    // clear route
            }}
            style={{ marginTop: "10px", padding: "6px 12px", cursor: "pointer" }}
          >
            Reset Map
          </button>
        )}

        
  {/* Ride comparison cards */}
  {location && destination && (
    <div style={{  display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px"}}>
      <TrainRide duration="30 min" cost="R20" />
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

          
          {/* {location && (
            <MarkerClusterer>
              {(clusterer) =>
                houses.map((house) => (
                  <Marker
                    key={`${house.lat}-${house.lng}`}
                    position={house}
                    clusterer={clusterer}
                  />
                ))
              }
            </MarkerClusterer>
          )} */}

          {/* Circles around location */}
          {/* {location && (
            <>
              <Circle center={location} radius={15000} options={closeOptions} />
              <Circle center={location} radius={30000} options={middleOptions} />
              <Circle center={location} radius={45000} options={farOptions} />
            </>
          )} */}
        </GoogleMap>
      </div>
    </div>
  );
}

// Circle options for safety visualizations
const defaultOptions = { strokeOpacity: 0.5, strokeWeight: 2, clickable: false, draggable: false, editable: false, visible: true };
const closeOptions: google.maps.CircleOptions = { ...defaultOptions, zIndex: 3, fillOpacity: 0.05, strokeColor: "#8BC34A", fillColor: "#8BC34A" };
const middleOptions = { ...defaultOptions, zIndex: 2, fillOpacity: 0.05, strokeColor: "#FBC02D", fillColor: "#FBC02D" };
const farOptions = { ...defaultOptions, zIndex: 1, fillOpacity: 0.05, strokeColor: "#FF5252", fillColor: "#FF5252" };

// Example function to generate cluster markers
// const generateHouses = (position: LatLngLiteral) => {
//   const _houses: LatLngLiteral[] = [];
//   for (let i = 0; i < 50; i++) {
//     const direction = Math.random() < 0.5 ? -2 : 2;
//     _houses.push({ lat: position.lat + Math.random() / direction, lng: position.lng + Math.random() / direction });
//   }
//   return _houses;
// };
