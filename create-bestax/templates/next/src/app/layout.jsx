import Navigation from '../Navigation';

// Bestax's stylesheet loads before the app's own CSS, so a named class in
// src/index.css wins over a Bulma rule of the same weight.
import '@allxsmith/bestax-bulma/bestax.css';
import '../index.css';

export const metadata = {
  title: 'Bestax + Next.js + React',
  description: 'A Next.js app built with bestax-bulma',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
