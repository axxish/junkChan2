import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Provider } from 'react-redux';
import { store } from './store.ts';

//import { mantineTheme } from './util/theme.ts';
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <Provider store={store}>

      <App />
    </Provider>

  </StrictMode>,
)
