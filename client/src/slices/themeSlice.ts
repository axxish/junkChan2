// src/slices/themeSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type ThemeState = {
    colorScheme: "light" | "dark";
};

const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

const initialState: ThemeState = {
    colorScheme: prefersDark ? "dark" : "light",
};

export const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        toggleColorScheme: (state) => {
            state.colorScheme = state.colorScheme === "dark" ? "light" : "dark";
        },
    },
});

export const { toggleColorScheme } = themeSlice.actions;

export default themeSlice.reducer;

export const selectColorScheme = (state: RootState) => state.theme.colorScheme;
