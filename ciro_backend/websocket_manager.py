from fastapi import WebSocket, WebSocketDisconnect
from typing import Set, Dict, List
import json
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            'admin': [],
            'responder': [],
            'viewer': []
        }
        self.incident_subscribers: Dict[str, Set[str]] = {}  # incident_id -> user_ids
        self.message_queue: asyncio.Queue = asyncio.Queue(maxsize=10000)

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        """
        Add new WebSocket connection with role-based filtering
        """
        await websocket.accept()
        self.active_connections[role].append(websocket)
        logger.info(f"User {user_id} ({role}) connected. Total: {len(self._get_all_connections())}")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "user_id": user_id,
            "role": role,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def disconnect(self, websocket: WebSocket, role: str):
        """
        Remove disconnected WebSocket
        """
        if websocket in self.active_connections[role]:
            self.active_connections[role].remove(websocket)
        logger.info(f"Connection closed. Total: {len(self._get_all_connections())}")

    async def broadcast_incident_update(self, incident_data: dict, incident_id: str):
        """
        Broadcast incident update to all subscribed clients
        
        Args:
            incident_data: Updated incident JSON
            incident_id: ID to filter subscribers
        """
        message = {
            "type": "incident_update",
            "incident_id": incident_id,
            "payload": incident_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected clients (role-based filtering happens client-side)
        disconnected = []
        for role in self.active_connections:
            for websocket in self.active_connections[role]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send to {role}: {e}")
                    disconnected.append((websocket, role))
        
        # Clean up failed connections
        for ws, role in disconnected:
            await self.disconnect(ws, role)

    async def broadcast_resource_location(self, resource_data: dict):
        """
        Stream resource location updates (higher frequency)
        Limited to responders and admins (save bandwidth)
        """
        message = {
            "type": "resource_location",
            "payload": resource_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Only send to responders and admins
        for role in ['responder', 'admin']:
            for websocket in self.active_connections[role]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass

    async def broadcast_alert(self, alert_data: dict, target_role: str = 'admin'):
        """
        Send critical alert to specific role
        """
        message = {
            "type": "critical_alert",
            "payload": alert_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        for websocket in self.active_connections[target_role]:
            try:
                await websocket.send_json(message)
            except Exception:
                pass

    async def send_to_user(self, user_id: str, message: dict):
        """
        Send message to specific user
        """
        # Implementation would track user_id to websocket mapping
        pass

    def _get_all_connections(self) -> List[WebSocket]:
        """Get all active connections across all roles"""
        all_conns = []
        for role in self.active_connections:
            all_conns.extend(self.active_connections[role])
        return all_conns

    def get_connection_count(self) -> Dict[str, int]:
        """Return connection count by role"""
        return {
            role: len(connections)
            for role, connections in self.active_connections.items()
        }

# Global manager instance
manager = ConnectionManager()
