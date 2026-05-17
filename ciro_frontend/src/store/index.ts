import { configureStore } from '@reduxjs/toolkit';
import incidentReducer from './slices/incidentSlice';
import resourceReducer from './slices/resourceSlice';
import uiReducer from './slices/uiSlice';
import { websocketMiddleware } from './middleware/websocketMiddleware';
import { persistMiddleware } from './middleware/persistMiddleware';

export const store = configureStore({
  reducer: {
    incidents: incidentReducer,
    resources: resourceReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['incidents/updateIncident'],
        ignoredPaths: ['incidents.entities.lastUpdate']
      }
    })
    .concat(websocketMiddleware, persistMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
