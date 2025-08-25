import { configureStore } from '@reduxjs/toolkit';
import boardsReducer from './slices/boardsSlice';
import themeReducer from './slices/themeSlice'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

export const store = configureStore({
  reducer: {
    boards: boardsReducer,
     theme: themeReducer,
  },
});



export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: (() => AppDispatch) = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
