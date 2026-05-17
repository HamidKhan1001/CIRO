import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ResourceState {
  byId: Record<string, any>;
  allIds: string[];
}

const initialState: ResourceState = {
  byId: {},
  allIds: []
};

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    updateResource: (state, action: PayloadAction<any>) => {
      const resource = action.payload;
      if (!state.byId[resource.unit_id]) {
        state.allIds.push(resource.unit_id);
      }
      state.byId[resource.unit_id] = resource;
    }
  }
});

export const { updateResource } = resourceSlice.actions;
export default resourceSlice.reducer;
