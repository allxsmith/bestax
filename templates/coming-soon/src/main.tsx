import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bestax's stylesheet loads before the app's own CSS, so a named class in
// src/index.css wins over a Bulma rule of the same weight. bulma-social's
// brand colors are modifiers on Bulma's `.button`, one file for each brand
// the page shows, and they load after src/index.css, as the original loads
// them after its own stylesheet.
import '@allxsmith/bestax-bulma/bestax.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import 'bulma-social/css/single/facebook/facebook.min.css';
import 'bulma-social/css/single/youtube/youtube.min.css';
import 'bulma-social/css/single/x/x.min.css';
import 'bulma-social/css/single/linkedin/linkedin.min.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
