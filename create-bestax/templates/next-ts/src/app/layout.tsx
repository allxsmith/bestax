import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Navigation from '../Navigation';

// Bestax's stylesheet loads before the app's own CSS, so a named class in
// src/index.css wins over a Bulma rule of the same weight.
import '@allxsmith/bestax-bulma/bestax.css';
import '../index.css';

export const metadata: Metadata = {
  title: 'Bestax + Next.js + React',
  description: 'A Next.js app built with bestax-bulma',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
