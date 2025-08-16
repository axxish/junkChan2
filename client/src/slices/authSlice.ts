import { createSlice } from '@reduxjs/toolkit';


export interface AuthState {
  user: null; 
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

// Set the initial state
const initialState: AuthState = {
  user: null,
  token: null, 
  status: 'idle',
};

// Create the slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
  },
});

export default authSlice.reducer;