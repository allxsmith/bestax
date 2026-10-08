import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bestax's stylesheet loads before the app's own CSS, so a named class in
// src/App.css wins over a Bulma rule of the same weight.
import '@allxsmith/bestax-bulma/bestax.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
