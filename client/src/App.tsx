// src/App.tsx

// REMOVED: import '@mantine/core/styles.css';
import { Home } from './pages/Home';
import { BrowserRouter, Routes, Route } from 'react-router';
import { IconMoon } from "@tabler/icons-react";
import { Nexus } from './pages/Nexus';
import { darkTheme, GlobalStyle, lightTheme } from './util/theme'; // Adjust path
import styled, { ThemeProvider } from 'styled-components'; // <-- Import styled
import { useAppDispatch, useAppSelector } from './store';
import { selectColorScheme, toggleColorScheme } from './slices/themeSlice';
import { ThreadList } from './pages/ThreadList';
import { ThreadView } from './pages/ThreadView';
import { LoginPage } from './pages/LoginPage';

// --- Create the styled component here ---
const ThemeToggleButton = styled.button`

  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;


  width: 44px;  
  height: 44px;
  border-radius: 50%; 

  background-color: #3a59d6; 
  color: white;
  border: none;
  cursor: pointer;

  
  display: flex;
  align-items: center;
  justify-content: center;


  transition: background-color 0.2s ease;

  &:hover {
    background-color: #364fc7; 
  }


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
          <Route element={<Nexus/>}>
            <Route path="/boards/:slug/*" element={<ThreadList />} />
            <Route path="/threads/:id/*" element={<ThreadView/>}/>
            <Route path="/login" element={<LoginPage/>}/>
          </Route>
        </Routes>
        
        <ThemeToggleButton onClick={() => dispatch(toggleColorScheme())}>
          <IconMoon />
        </ThemeToggleButton>

      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;