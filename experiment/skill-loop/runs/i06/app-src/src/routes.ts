export type PageId =
  | 'home'
  | 'benchmarks'
  | 'models'
  | 'pricing'
  | 'docs'
  | 'safety'
  | 'contact';

export interface Route {
  id: PageId;
  label: string;
  /** Shown in the main navbar (contact is reached from the CTA buttons). */
  inNav: boolean;
}

export const ROUTES: Route[] = [
  { id: 'home', label: 'Overview', inNav: false },
  { id: 'benchmarks', label: 'Benchmarks', inNav: true },
  { id: 'models', label: 'Models', inNav: true },
  { id: 'pricing', label: 'Pricing', inNav: true },
  { id: 'docs', label: 'Docs', inNav: true },
  { id: 'safety', label: 'Safety', inNav: true },
  { id: 'contact', label: 'Contact', inNav: false },
];

export type Navigate = (page: PageId) => void;

export interface PageProps {
  onNavigate: Navigate;
}
