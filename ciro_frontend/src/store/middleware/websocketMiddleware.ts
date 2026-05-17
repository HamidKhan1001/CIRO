import { Middleware } from '@reduxjs/toolkit';
import { updateIncident, removeIncident } from '../slices/incidentSlice';

export const websocketMiddleware: Middleware = (storeAPI) => (next) => (action: any) => {
  // Pass action to next middleware
  const result = next(action);

  // Listen for WebSocket updates
  if (action.type === 'websocket/message') {
    const { type: msgType, payload } = action.payload;

    switch (msgType) {
      case 'incident_update':
        storeAPI.dispatch(updateIncident(payload));
        break;
      case 'incident_resolved':
        storeAPI.dispatch(removeIncident(payload.incident_id));
        break;
    }
  }

  return result;
};
