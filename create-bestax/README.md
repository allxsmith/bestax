# create-bestax

CLI tool for scaffolding new bestax-bulma projects.

## Usage

```bash
npx create-bestax my-app
```

## Templates

Available templates:
- `vite` - Vite + JavaScript
- `vite-ts` - Vite + TypeScript
- `nextjs` - Next.js (coming soon)
- `nextjs-ts` - Next.js + TypeScript (coming soon)

## Development

```bash
npm run build    # Build the CLI
npm run dev      # Watch mode
npm test         # Run tests
```

## Publishing

This package uses semantic-release with scope-based rules. Only commits with `feat(create-bestax)` or `fix(create-bestax)` will trigger releases.

## Known Issues

**Templates Location**: Currently templates exist in both `/templates/` (root) and `/create-bestax/templates/`. The package.json references `templates` which will look for `/create-bestax/templates/` when published to npm. The root `/templates/` directory should be removed to avoid confusion, but is currently committed in the monorepo root.

**Workaround**: The CLI code uses `path.resolve(__dirname, '../../templates')` which correctly resolves to the package's templates folder when running from the compiled dist.
