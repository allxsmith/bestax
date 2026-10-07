import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import Bestax CSS (Bulma + extras) ahead of the app's own styles
import '@allxsmith/bestax-bulma/bestax.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
