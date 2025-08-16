import { configureStore } from '@reduxjs/toolkit';
import boardsReducer from './slices/boardsSlice';
import authReducer from './slices/authSlice'; // <-- 1. IMPORT THE NEW REDUCER
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import App from './App';

export const store = configureStore({
  reducer: {
    boards: boardsReducer,
    auth: authReducer, 
  },
});



export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: (() => AppDispatch) = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector