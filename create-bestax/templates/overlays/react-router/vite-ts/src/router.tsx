import { createBrowserRouter } from 'react-router';
import Layout from './Layout.tsx';
import App from './App.tsx';
import About from './pages/About.tsx';

// The routes, in React Router's data mode. App, the starter page, is the home
// page. To add a page, write it in src/pages, add a route for it here, and
// link to it from the navbar in src/Layout.tsx.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <App /> },
      { path: 'about', element: <About /> },
    ],
  },
]);
