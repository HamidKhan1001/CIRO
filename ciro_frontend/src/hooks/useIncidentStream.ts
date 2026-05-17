import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export const useIncidentStream = (userId: string, role: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incidents, setIncidents] = useState<Map<string, any>>(new Map());
  const reconnectCount = useRef(0);
  const messageQueue = useRef<WebSocketMessage[]>([]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/incidents/${userId}/${role}`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectCount.current = 0;

        // Flush queued messages
        while (messageQueue.current.length > 0) {
          const msg = messageQueue.current.shift();
          if (msg) ws.current?.send(JSON.stringify(msg));
        }

        // Start heartbeat
        startHeartbeat();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'incident_update':
              setIncidents((prev) => {
                const updated = new Map(prev);
                updated.set(
                  message.payload.incident_id,
                  message.payload
                );
                return updated;
              });
              break;

            case 'resource_location':
              // Handle resource update (store separately if needed)
              break;

            case 'critical_alert':
              // Handle critical alert
              break;

            case 'heartbeat_ack':
              // Server acknowledged our ping
              break;
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000);
        reconnectCount.current++;

        setTimeout(() => {
          console.log(`Attempting to reconnect (attempt ${reconnectCount.current})...`);
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [userId, role]);

  const startHeartbeat = () => {
    const interval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'heartbeat' }));
      } else {
        clearInterval(interval);
      }
    }, 15000); // Ping every 15 seconds
  };

  const subscribeToIncident = (incidentId: string) => {
    const message = {
      type: 'subscribe_incident',
      incident_id: incidentId
    } as any;

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      messageQueue.current.push(message);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    incidents,
    subscribeToIncident
  };
};
