import MapboxGL from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapConfig {
  centerLat?: number;
  centerLon?: number;
  zoomLevel?: number;
  maxBounds?: [[number, number], [number, number]];
  style?: string; // Mapbox dark theme style URL
  accessToken?: string; // From environment
  incidents?: any[];
}

export const CrisisMap: React.FC<MapConfig> = ({
  centerLat = 33.7298,
  centerLon = 73.0471, // Center on Islamabad/Rawalpindi
  zoomLevel = 11,
  maxBounds = undefined, // Relax bounds to prevent viewport locking issues
  style = 'mapbox://styles/mapbox/dark-v11',
  accessToken = (import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN) || '',
  incidents = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    MapboxGL.accessToken = accessToken;

    map.current = new MapboxGL.Map({
      container: mapContainer.current,
      style: style,
      center: [centerLon, centerLat],
      zoom: zoomLevel,
      pitch: 0,
      bearing: 0,
      maxBounds: maxBounds,
      maxZoom: 18,
      minZoom: 8,
      
      // Performance optimizations
      preserveDrawingBuffer: false, // Don't capture canvas
      antialias: true, // Smooth edges (minimal perf hit)
      // optimizeForTerrain: false, // We're not using terrain
      
      // Critical: Enable GPU rendering
      transformRequest: (url, resourceType) => {
        if (resourceType === 'Source' && url.startsWith('http')) {
          return {
            url: url,
            headers: { 'X-Custom-Auth': 'CIRO-' + Date.now() }
          };
        }
        return { url };
      }
    });

    map.current.on('load', () => {
      initializeMapLayers();
      setIsLoaded(true);
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, [accessToken, style, centerLat, centerLon, zoomLevel, maxBounds]);

  useEffect(() => {
    if (!map.current || !isLoaded || !incidents) return;

    const geojson = {
      type: 'FeatureCollection' as const,
      features: incidents.map((inc: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [inc.location_lon || 73.0471, inc.location_lat || 33.7298]
        },
        properties: {
          incident_id: inc.incident_id,
          crisis_type: inc.crisis_type || inc.type || 'UNKNOWN',
          severity: inc.severity || 'UNKNOWN',
          severity_numeric: inc.severity_numeric || (
            inc.severity === 'CRITICAL' ? 5 :
            inc.severity === 'HIGH' ? 4 :
            inc.severity === 'MEDIUM' ? 3 :
            inc.severity === 'LOW' ? 2 : 1
          ),
          affected_population: inc.affected_population || 0
        }
      }))
    };

    const incidentsSource = map.current.getSource('incidents') as MapboxGL.GeoJSONSource;
    if (incidentsSource) {
      incidentsSource.setData(geojson);
    }
    const heatmapSource = map.current.getSource('incidents-heatmap') as MapboxGL.GeoJSONSource;
    if (heatmapSource) {
      heatmapSource.setData(geojson);
    }
  }, [incidents, isLoaded]);

  const initializeMapLayers = () => {
    if (!map.current) return;

    // Layer 1: Incident clusters (grouped by proximity)
    map.current.addSource('incidents', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 15,
      clusterRadius: 50, // Pixels at which to cluster
      clusterProperties: {
        'sum_affected': ['+', ['get', 'affected_population']],
        'max_severity': ['max', ['get', 'severity_numeric']]
      }
    });

    // Layer 2: Heatmap (density visualization)
    map.current.addSource('incidents-heatmap', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Layer 3: Resource locations (vehicles)
    map.current.addSource('resources', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // PAINT LAYERS FOR CLUSTERS
    addClusterPaintLayers();
    addResourcePaintLayers();
    addHeatmapLayer();
  };

  const addClusterPaintLayers = () => {
    if (!map.current) return;

    // Cluster circles - size by incident count
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'incidents',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'max_severity'],
          '#ef4444', // Red for CRITICAL (5)
          4, '#f97316', // Orange for HIGH (4)
          3, '#f59e0b', // Amber for MEDIUM (3)
          2, '#10b981'  // Green for LOW (2)
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // Size for 1-5 incidents
          50, // Size for 5-50 incidents
          100  // Size for 50+ incidents
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.85
      }
    });

    // Cluster count labels
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'incidents',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': '#fff'
      }
    });

    // Single incidents (unclustered)
    map.current.addLayer({
      id: 'single-incidents',
      type: 'circle',
      source: 'incidents',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'crisis_type'],
          'FLOOD', '#3b82f6',
          'FIRE', '#ef4444',
          'EARTHQUAKE', '#f59e0b',
          'HEATWAVE', '#dc2626',
          'DISEASE', '#8b5cf6',
          '#6b7280' // default gray
        ],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 5, // At zoom 8, radius 5px
          15, 12 // At zoom 15, radius 12px
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 1
      }
    });

    // Pulsing animation for critical incidents
    map.current.setFeatureState(
      { source: 'incidents', id: 'critical-incident' },
      { pulse: true }
    );
  };

  const addResourcePaintLayers = () => {
    if (!map.current) return;

    // Resource symbols (ambulances, police, fire, rescue)
    map.current.addLayer({
      id: 'resources-layer',
      type: 'symbol',
      source: 'resources',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 0.5,
          15, 1.2
        ],
        'icon-allow-overlap': true,
        'text-field': ['get', 'unit_id'],
        'text-offset': [0, 1.5],
        'text-size': 12,
        'text-font': ['Open Sans Semibold']
      },
      paint: {
        'text-color': '#fff',
        'text-halo-color': '#000',
        'text-halo-width': 1
      }
    });
  };

  const addHeatmapLayer = () => {
    if (!map.current) return;

    map.current.addLayer({
      id: 'heatmap',
      type: 'heatmap',
      source: 'incidents-heatmap',
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'affected_population'],
          0, 0,
          100, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          9, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0, 0, 255, 0)',
          0.25, 'rgb(0, 0, 255)',
          0.5, 'rgb(0, 255, 255)',
          0.75, 'rgb(255, 255, 0)',
          1, 'rgb(255, 0, 0)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          9, 20
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 0,
          8, 1,
          16, 0.8
        ]
      }
    });
  };

  if (!accessToken || accessToken === '') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          color: '#9CA3AF'
        }}
      >
        <MapPin className="w-16 h-16 text-gray-500 mb-4" />
        <h4 style={{ color: '#F3F4F6', fontWeight: 'bold', marginBottom: '8px' }}>Mapbox Token Missing</h4>
        <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.6' }}>
          To enable live 3D rendering and incident heatmap mapping, please add a <code>.env</code> file under <code>ciro_frontend/</code> with:
        </p>
        <code style={{ display: 'block', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '6px', marginTop: '12px', color: '#3B82F6', fontFamily: 'monospace' }}>
          VITE_MAPBOX_TOKEN=your_token_here
        </code>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        position: 'relative'
      }}
    >
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          textAlign: 'center'
        }}>
          <div className="loader" />
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};
