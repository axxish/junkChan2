import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type Board } from "../util/types.ts";
import apiClient from "../util/axiosClient.ts";

interface BoardsState {
  boards: Board[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}


const initialState: BoardsState = {
  boards: [],
  status: 'idle',
  error: null,
};

export const fetchBoards = createAsyncThunk('boards/fetchBoards', async () => {
  const response = await apiClient.get<Board[]>('/functions/v1/boards');

  const sortedData = response.data.sort((a, b) => a.name.localeCompare(b.name));
  return sortedData;
});

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.status = 'loading'; 
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = 'succeeded'; 
        state.boards = action.payload; 
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.status = 'failed';  
        state.error = action.error.message || 'Something went wrong';
      });
  },
});


export default boardsSlice.reducer;