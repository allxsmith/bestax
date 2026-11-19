import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bestax's stylesheet loads before the app's own CSS, so a named class in
// src/index.css wins over a Bulma rule of the same weight. bulma-social's
// brand colors are modifiers on Bulma's `.button`, so they load after it,
// one file for each brand the footer shows.
import '@allxsmith/bestax-bulma/bestax.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bulma-social/css/single/facebook/facebook.min.css';
import 'bulma-social/css/single/instagram/instagram.min.css';
import 'bulma-social/css/single/twitter/twitter.min.css';
import 'bulma-social/css/single/youtube/youtube.min.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
