import Dexie, { Table } from 'dexie';

interface CachedCluster {
  id: string;
  bbox: string;
  zoom: number;
  geojson: GeoJSON.FeatureCollection;
  timestamp: number;
}

class ClusterDatabase extends Dexie {
  clusters!: Table<CachedCluster>;

  constructor() {
    super('ciro-clusters');
    this.version(1).stores({
      clusters: '++id, bbox, zoom, timestamp'
    });
  }
}

const db = new ClusterDatabase();

export const clusterCache = {
  async get(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    zoom: number
  ): Promise<GeoJSON.FeatureCollection | null> {
    const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
    const cached = await db.clusters
      .where('bbox')
      .equals(bbox)
      .filter(c => c.zoom === zoom && Date.now() - c.timestamp < 60000) // 1 min TTL
      .first();

    return cached?.geojson || null;
  },

  async set(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    zoom: number,
    geojson: GeoJSON.FeatureCollection
  ): Promise<void> {
    const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
    await db.clusters.add({
      id: `${bbox}:${zoom}`,
      bbox,
      zoom,
      geojson,
      timestamp: Date.now()
    });
  },

  async clear(): Promise<void> {
    await db.clusters.where('timestamp').below(Date.now() - 3600000).delete(); // Delete 1h old
  }
};
