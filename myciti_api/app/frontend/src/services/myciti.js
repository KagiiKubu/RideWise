const API_BASE_URL = process.env.MYCITI_API_URL || 'http://localhost:8000';

class MyCiTiTripService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Main method - takes 2 locations, returns formatted result of the trip
  async getTrip(startLocation, endLocation) {
    this._validateInputs(startLocation, endLocation);
    const rawData = await this._callApi(startLocation, endLocation);
    return this._formatResult(rawData);
  }

  // Validate inputs
  _validateInputs(start, end) {
    if (!start || typeof start !== 'string' || !start.trim()) {
      throw new Error('Start location is required and must be a non-empty string');
    }
    if (!end || typeof end !== 'string' || !end.trim()) {
      throw new Error('End location is required and must be a non-empty string');
    }
    if (start.trim().toLowerCase() === end.trim().toLowerCase()) {
      throw new Error('Start and end locations cannot be the same');
    }
  }

  // Call FastAPI backend
  async _callApi(start, end) {
    try {
      const params = new URLSearchParams({ start: start.trim(), end: end.trim() });
      const url = `${this.baseUrl}/nearest-stops/?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // fallback to default message
        }
        throw new Error(`${errorMessage} (URL: ${url})`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error connecting to MyCiTi service. Please check the service URL.');
      }
      throw error;
    }
  }

  // Format API response
  _formatResult(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from MyCiTi service');
    }

    const requiredFields = ['start', 'end', 'trip_distance_km', 'is_peak_time', 'fare_rands'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field in response: ${field}`);
      }
    }

    const totalWalkingDistance =
      (data.start?.distance_meters || 0) + (data.end?.distance_meters || 0);
    const costPerKm =
      data.trip_distance_km > 0 ? data.fare_rands / data.trip_distance_km : 0;

    return {
      // Trip overview
      summary: {
        from: data.start.address,
        to: data.end.address,
        distance: `${data.trip_distance_km.toFixed(1)} km`,
        fare: `R${data.fare_rands.toFixed(2)}`,
        duration: this._estimateDuration(data.trip_distance_km, data.is_peak_time),
        peakTime: data.is_peak_time,
      },

      // Detailed breakdown
      details: {
        start: {
          address: data.start.address,
          coordinates: data.start.coordinates,
          nearestStop: data.start.nearest_stop.name,
          walkingDistance: `${Math.round(data.start.distance_meters)}m`,
          walkingTime: `${Math.ceil((data.start.distance_meters / 1.4) / 60)}min`,
        },
        end: {
          address: data.end.address,
          coordinates: data.end.coordinates,
          nearestStop: data.end.nearest_stop.name,
          walkingDistance: `${Math.round(data.end.distance_meters)}m`,
          walkingTime: `${Math.ceil((data.end.distance_meters / 1.4) / 60)}min`,
        },
        trip: {
          distanceKm: data.trip_distance_km,
          fareRands: data.fare_rands,
          isPeakTime: data.is_peak_time,
          fareType: data.is_peak_time ? 'Peak Fare' : 'Saver Fare',
          costPerKm: `R${costPerKm.toFixed(2)}/km`,
          totalWalkingDistance: `${Math.round(totalWalkingDistance)}m`,
          totalWalkingTime: `${Math.ceil((totalWalkingDistance / 1.4) / 60)}min`,
        },
      },

      // Comparison values
      comparison: {
        provider: 'MyCiTi Bus',
        type: 'Public Transport',
        fare: data.fare_rands,
        distance: data.trip_distance_km,
        estimatedDuration: this._estimateDuration(
          data.trip_distance_km,
          data.is_peak_time
        ),
        walkingRequired: Math.round(totalWalkingDistance),
        efficiency: this._calculateEfficiency(
          data.trip_distance_km,
          totalWalkingDistance,
          data.fare_rands
        ),
      },
    };
  }

  // Estimate trip duration
  _estimateDuration(distanceKm, isPeakTime) {
    const avgSpeed = isPeakTime ? 18 : 25; // km/h including stops
    const transitMinutes = (distanceKm / avgSpeed) * 60;
    const waitingTime = isPeakTime ? 8 : 12; // average waiting time
    const totalMinutes = Math.round(transitMinutes + waitingTime);

    if (totalMinutes < 60) return `${totalMinutes}min`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }

  // Calculate efficiency score (0–100) - We probably also don't want users to be walking an extremely long distance
  _calculateEfficiency(tripKm, walkingMeters, fare) {
    const walkingRatio = (walkingMeters / 1000) / tripKm;
    const costEfficiency = Math.max(0, 100 - (fare / tripKm) * 10);
    const walkingEfficiency = Math.max(0, 100 - (walkingRatio * 200));
    return Math.round((costEfficiency + walkingEfficiency) / 2);
  }
}

export default MyCiTiTripService;

console.log('Loaded successfully!');
