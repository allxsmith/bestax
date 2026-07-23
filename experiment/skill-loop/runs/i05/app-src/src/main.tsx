import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Import CSS
import '@allxsmith/bestax-bulma/bestax.css';
// Font Awesome supplies the glyphs for <Icon>; ConfigProvider sets the library.
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
