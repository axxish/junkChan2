import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Provider } from 'react-redux'; 
import { store } from './store'; 
import { MantineProvider } from '@mantine/core';
import { mantineTheme } from './util/theme.ts';
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    
    <Provider store={store}>
      <MantineProvider defaultColorScheme='dark' theme={mantineTheme} >
    <App />
      </MantineProvider>
    </Provider>
    
  </StrictMode>,
)
