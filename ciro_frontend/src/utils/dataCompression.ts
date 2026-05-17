import pako from 'pako';

const CRISIS_TYPES = ['UNKNOWN', 'FLOOD', 'FIRE', 'EARTHQUAKE', 'HEATWAVE', 'DISEASE'];
const SEVERITIES = ['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const compressGeoJSON = (geojson: any): Uint8Array => {
  const incidents = geojson.features.map((feature: any) => ({
    i: feature.properties.incident_id,
    t: CRISIS_TYPES.indexOf(feature.properties.crisis_type || 'UNKNOWN'),
    s: typeof feature.properties.severity === 'number' 
      ? feature.properties.severity 
      : SEVERITIES.indexOf(feature.properties.severity || 'UNKNOWN'),
    p: feature.geometry.coordinates,
    a: feature.properties.affected_population,
    e: feature.properties.eta_seconds || 0
  }));

  // Gzip compression
  return pako.gzip(JSON.stringify(incidents));
};

export const decompressGeoJSON = (buffer: Uint8Array): any => {
  const decompressed = pako.ungzip(buffer, { to: 'string' });
  const incidents = JSON.parse(decompressed);
  
  // Expand back to full format
  return {
    type: 'FeatureCollection',
    features: incidents.map((inc: any) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: inc.p },
      properties: {
        incident_id: inc.i,
        crisis_type: CRISIS_TYPES[inc.t] || 'UNKNOWN',
        severity: SEVERITIES[inc.s] || 'UNKNOWN',
        affected_population: inc.a,
        eta_seconds: inc.e
      }
    }))
  };
};
