import { configureStore } from '@reduxjs/toolkit';
import incidentReducer from './slices/incidentSlice';
import { websocketMiddleware } from './middleware/websocketMiddleware';

export const store = configureStore({
  reducer: {
    incidents: incidentReducer,
    // resources: resourceReducer,
    // ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['incidents/updateIncident'],
        ignoredPaths: ['incidents.entities.lastUpdate']
      }
    })
    .concat(websocketMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
