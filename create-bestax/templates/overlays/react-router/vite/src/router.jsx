import { createBrowserRouter } from 'react-router';
import Layout from './Layout.jsx';
import App from './App.jsx';
import About from './pages/About.jsx';

// The routes, in React Router's data mode. App, the starter page, is the home
// page. To add a page, write it in src/pages, add a route for it here, and
// link to it from the navbar in src/Layout.jsx.
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
