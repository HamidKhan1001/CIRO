import sqlite3
import os

# If running in a container (Cloud Run), write SQLite to /tmp which is fully writeable
if os.path.exists("/.dockerenv") or os.environ.get("PORT"):
    DB_PATH = "/tmp/ciro_cloud.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "ciro_cloud.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create incidents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        type TEXT,
        severity TEXT,
        confidence REAL,
        affected_population INTEGER,
        location_lat REAL,
        location_lon REAL,
        location_address TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create signals table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS signals (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        source TEXT,
        content TEXT,
        credibility REAL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(incident_id) REFERENCES incidents(id)
    )
    """)
    
    # Create allocations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resource_allocations (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        resource_type TEXT,
        quantity INTEGER,
        allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(incident_id) REFERENCES incidents(id)
    )
    """)

    # Create offline queue table (for sync testing)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS message_queue (
        id TEXT PRIMARY KEY,
        content TEXT,
        status TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()
