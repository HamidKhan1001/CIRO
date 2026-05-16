import * as Location from 'expo-location';

class LocationService {
  async getPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation() {
    const hasPermission = await this.getPermissions();
    if (!hasPermission) return null;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async reverseGeocode(lat, lon) {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      if (result.length > 0) {
        const addr = result[0];
        return `${addr.streetNumber || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`;
      }
      return 'Unknown Address';
    } catch (error) {
      return 'Address unavailable';
    }
  }
}

export const locationService = new LocationService();
