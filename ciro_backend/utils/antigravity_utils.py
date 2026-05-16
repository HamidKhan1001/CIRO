import uuid
import time
from datetime import datetime
from functools import wraps
from typing import Any, Dict, Optional

class AntigravityTrace:
    def __init__(self, name: str, parent_id: Optional[str] = None):
        self.execution_id = str(uuid.uuid4())
        self.parent_execution_id = parent_id
        self.agent_name = name
        self.start_time = time.time()
        self.timestamp_utc = datetime.utcnow().isoformat() + "Z"

    def get_metadata(self) -> Dict[str, Any]:
        duration_ms = int((time.time() - self.start_time) * 1000)
        return {
            "execution_id": self.execution_id,
            "parent_execution_id": self.parent_execution_id,
            "timestamp_utc": self.timestamp_utc,
            "agent_name": self.agent_name,
            "duration_ms": duration_ms
        }

def agent(name: str, description: str, version: str = "3.0.0", timeout_seconds: int = 30, max_tokens: int = 2000):
    def decorator(cls):
        # We'll add metadata to the class for future reference
        cls._antigravity_config = {
            "name": name,
            "description": description,
            "version": version,
            "timeout_seconds": timeout_seconds,
            "max_tokens": max_tokens
        }
        
        # We can also wrap the process method if we want to automate metadata injection
        # However, it might be better to let the agent handle it if it needs to pass the ID to the prompt
        return cls
    return decorator

def create_execution_metadata(agent_name: str, parent_id: Optional[str] = None, start_time: float = None) -> Dict[str, Any]:
    return {
        "execution_id": str(uuid.uuid4()),
        "parent_execution_id": parent_id,
        "timestamp_utc": datetime.utcnow().isoformat() + "Z",
        "agent_name": agent_name,
        "duration_ms": int((time.time() - (start_time or time.time())) * 1000)
    }
