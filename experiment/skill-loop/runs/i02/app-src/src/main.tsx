import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from '@allxsmith/bestax-bulma';
import App from './App.tsx';

// Import CSS
import '@allxsmith/bestax-bulma/bestax.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Icon library set once here — no `library` prop on individual <Icon>s. */}
    <ConfigProvider iconLibrary="fa">
      <App />
    </ConfigProvider>
  </StrictMode>
);
