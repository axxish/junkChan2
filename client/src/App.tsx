// src/App.tsx

// REMOVED: import '@mantine/core/styles.css';
import { Home } from './pages/Home';
import { BrowserRouter, Routes, Route } from 'react-router';
import { IconMoon } from "@tabler/icons-react";
import { BoardPage } from './pages/BoardPage';
import { darkTheme, GlobalStyle, lightTheme } from './util/styledTheme'; // Adjust path
import styled, { ThemeProvider } from 'styled-components'; // <-- Import styled
import { useAppDispatch, useAppSelector } from './store';
import { selectColorScheme, toggleColorScheme } from './slices/themeSlice';

// --- Create the styled component here ---
const ThemeToggleButton = styled.button`

  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;


  width: 44px;  
  height: 44px;
  border-radius: 50%; // For a perfect circle
  
  /* Appearance */
  background-color: #3a59d6; // A default indigo color, can be themed later if needed
  color: white;
  border: none;
  cursor: pointer;

  /* Flexbox for centering the icon */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Smooth transition for hover effect */
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #364fc7; // A slightly darker indigo
  }

  /* Hiding on small screens, equivalent to 'visibleFrom="sm"' */
  @media (max-width: 768px) { // Assuming 'sm' breakpoint is 768px. Adjust if necessary.
    display: none;
  }
`;

function App() {
  const colorScheme = useAppSelector(selectColorScheme);
  const dispatch = useAppDispatch();

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <GlobalStyle />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/boards/:slug/*" element={<BoardPage />} />
        </Routes>
        
        <ThemeToggleButton onClick={() => dispatch(toggleColorScheme())}>
          <IconMoon />
        </ThemeToggleButton>

      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;