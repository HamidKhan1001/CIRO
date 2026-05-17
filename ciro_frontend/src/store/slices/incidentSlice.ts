import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface IncidentState {
  byId: Record<string, any>;
  allIds: string[];
  lastUpdate: string;
}

const initialState: IncidentState = {
  byId: {},
  allIds: [],
  lastUpdate: ''
};

const incidentSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    updateIncident: (state, action: PayloadAction<any>) => {
      const incident = action.payload;
      if (!state.byId[incident.incident_id]) {
        state.allIds.push(incident.incident_id);
      }
      state.byId[incident.incident_id] = incident;
      state.lastUpdate = new Date().toISOString();
    },
    
    removeIncident: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter(aid => aid !== id);
    }
  }
});

export const { updateIncident, removeIncident } = incidentSlice.actions;
export default incidentSlice.reducer;
