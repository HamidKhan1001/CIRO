import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'ciro_v3.db';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return;
    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await this.runMigrations();
    console.log('Database initialized');
  }

  async runMigrations() {
    // Main incident table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        crisis_type TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN')),
        location_lat REAL,
        location_lon REAL,
        location_address TEXT,
        affected_population INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE',
        created_at INTEGER,
        updated_at INTEGER,
        sync_status TEXT DEFAULT 'PENDING'
      );

      CREATE TABLE IF NOT EXISTS signals (
        signal_id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        source TEXT,
        text TEXT,
        credibility REAL DEFAULT 0.5,
        timestamp INTEGER,
        device_id TEXT,
        FOREIGN KEY(incident_id) REFERENCES incidents(incident_id)
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action_type TEXT,
        payload TEXT,
        timestamp INTEGER,
        status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        next_retry INTEGER
      );

      CREATE TABLE IF NOT EXISTS response_cache (
        endpoint TEXT PRIMARY KEY,
        response TEXT,
        cached_at INTEGER,
        expires_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        title TEXT,
        message TEXT,
        read INTEGER DEFAULT 0,
        timestamp INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);
      CREATE INDEX IF NOT EXISTS idx_signals_incident ON signals(incident_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `);
  }

  // Incident Operations
  async addIncident(incident) {
    const sql = `
      INSERT OR REPLACE INTO incidents (
        incident_id, crisis_type, severity, location_lat, location_lon, location_address,
        affected_population, created_at, updated_at, sync_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.runAsync(sql, [
      incident.incident_id,
      incident.crisis_type,
      incident.severity,
      incident.location_lat || 0,
      incident.location_lon || 0,
      incident.location_address || '',
      incident.affected_population || 0,
      incident.created_at || Date.now(),
      Date.now(),
      incident.sync_status || 'PENDING',
      incident.status || 'ACTIVE'
    ]);
  }

  async getIncidents(status = null) {
    let sql = 'SELECT * FROM incidents ORDER BY created_at DESC';
    const params = [];
    if (status) {
      sql = 'SELECT * FROM incidents WHERE status = ? ORDER BY created_at DESC';
      params.push(status);
    }
    return await this.db.getAllAsync(sql, params);
  }

  // Sync Queue Operations
  async addToSyncQueue(id, type, payload) {
    await this.db.runAsync(
      'INSERT INTO sync_queue (id, action_type, payload, timestamp, status) VALUES (?, ?, ?, ?, ?)',
      [id, type, JSON.stringify(payload), Date.now(), 'PENDING']
    );
  }

  async getPendingSync() {
    return await this.db.getAllAsync('SELECT * FROM sync_queue WHERE status = "PENDING"');
  }

  async updateSyncStatus(id, status, retryCount = 0) {
    await this.db.runAsync(
      'UPDATE sync_queue SET status = ?, retry_count = ? WHERE id = ?',
      [status, retryCount, id]
    );
  }
}

export const dbService = new DatabaseService();
