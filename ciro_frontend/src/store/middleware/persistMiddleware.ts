import { Middleware } from '@reduxjs/toolkit';

export const persistMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  
  // Minimal persist middleware that could sync specific slices to localStorage
  // if needed. Kept minimal as per the prompt's architecture shell.
  
  return result;
};
