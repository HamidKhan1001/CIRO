import { booleanPointInPolygon } from '@turf/turf';

interface Geofence {
  id: string;
  polygon: GeoJSON.Polygon;
  name: string;
  type: 'restricted' | 'evacuation' | 'danger';
  alert_distance: number; // degrees
}

export const checkGeofenceViolation = (
  lat: number,
  lon: number,
  geofences: Geofence[]
) => {
  const point: GeoJSON.Point = {
    type: 'Point',
    coordinates: [lon, lat]
  };

  return geofences
    .filter(gf => booleanPointInPolygon(point, gf.polygon))
    .map(gf => ({
      geofence_id: gf.id,
      type: gf.type,
      name: gf.name,
      distance: 0
    }));
};
