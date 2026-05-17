import MapboxGL from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

interface MapConfig {
  centerLat?: number;
  centerLon?: number;
  zoomLevel?: number;
  maxBounds?: [[number, number], [number, number]];
  style?: string; // Mapbox dark theme style URL
  accessToken?: string; // From environment
}

export const CrisisMap: React.FC<MapConfig> = ({
  centerLat = 33.7298,
  centerLon = 74.3520,
  zoomLevel = 11,
  maxBounds = [[73.1, 33.5], [74.6, 34.0]], // Peshawar bounds
  style = 'mapbox://styles/mapbox/dark-v11',
  accessToken = (import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN) || ''
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

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
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
