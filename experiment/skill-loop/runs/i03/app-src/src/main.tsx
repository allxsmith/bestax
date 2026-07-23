import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Import CSS
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@allxsmith/bestax-bulma/bestax.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
