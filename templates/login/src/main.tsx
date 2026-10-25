import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bestax's stylesheet loads before the app's own CSS, so a named class in
// src/index.css wins over a Bulma rule of the same weight. bulma-social and
// Font Awesome come between them, in the order the original loads them.
// bulma-social's brand colors are modifiers on Bulma's `.button`, one file
// for each brand the page shows.
import '@allxsmith/bestax-bulma/bestax.css';
import 'bulma-social/css/single/facebook/facebook.min.css';
import 'bulma-social/css/single/twitter/twitter.min.css';
import 'bulma-social/css/single/github/github.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
