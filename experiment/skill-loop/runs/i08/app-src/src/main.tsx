import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Import CSS
import '@allxsmith/bestax-bulma/bestax.css';
// Font Awesome — the glyph source for <ConfigProvider iconLibrary="fa">.
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
