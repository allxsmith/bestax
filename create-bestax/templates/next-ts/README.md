# Bestax + Next.js + TypeScript Template

This template provides a minimal Next.js App Router setup with TypeScript and bestax-bulma components.

## Getting Started

```bash
pnpm install
pnpm run dev
```

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Serve the production build
- `pnpm run lint` - Run Oxlint

## Features

- ▲ Next.js App Router
- 🎨 Bulma CSS framework
- 📦 bestax-bulma component library
- 📘 TypeScript for type safety
- 🔧 Oxlint pre-configured

## How It Fits Together

- `src/app/layout.tsx` loads the stylesheets and renders the navbar on every page.
- `src/app/page.tsx` is the home page. It renders `src/App.tsx`, the starter page, a client component.
- `src/app/about/page.tsx` is a Server Component that renders bestax components directly.
- `src/Navigation.tsx` is the navbar, a client component that links with `next/link`.

## Learn More

- [Bestax Documentation](https://bestax.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [Bulma Documentation](https://bulma.io)
