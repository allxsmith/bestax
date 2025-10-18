# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

bestax-bulma is a monorepo containing a React component library built on Bulma CSS v1 and a Docusaurus documentation site. The project uses TypeScript, Turbo for monorepo management, and maintains 99% test coverage.

## Docusaurus URL

https://bestax.io

## Development Commands

### Essential Commands (run from root)

- `npm install` - Install all dependencies
- `npm run dev` - Start development servers (both component library and docs)
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint all packages
- `npm run typecheck` - Type check all packages
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check code formatting
- `npm run all` - Run all quality checks (build, typecheck, test, coverage, lint, format:check, build-storybook)

### Component Development (bulma-ui)

- `npm run storybook` - Start Storybook for interactive component development
- `npm run build-storybook` - Build Storybook static site

### Documentation Development

- `npm run docs` - Start Docusaurus dev server (localhost:3000), this uses the currently published bulma-ui or bestax-bulma package

### Live Documentation Development

- `npm run watch --workspace=bulma-ui` - Watch for coding changes to the bulma-ui project
- `npm start --workspace=docs` - Run the doc site using current bulma-ui changes, must run watch command above

### Testing

- From bulma-ui: `npm run test:watch` - Run tests in watch mode for TDD
- Single test file: `npx jest path/to/test.tsx`

## Architecture

### Monorepo Structure

- **Root**: Turbo-based monorepo with shared ESLint/Prettier config
- **bulma-ui/**: React component library (@allxsmith/bestax-bulma)
  - src/columns/ - Column layout components
  - src/components/ - Complex components (Card, Modal, Navbar, etc.)
  - src/elements/ - Basic elements (Button, Table, etc.)
  - src/form/ - Form controls and inputs
  - src/grid/ - CSS Grid components
  - src/helpers/ - Utilities and hooks (classNames, useBulmaClasses, Theme, Config)
  - src/layout/ - Layout components (Container, Hero, Section, etc.)
- **docs/**: Docusaurus documentation site

### Key Design Patterns

1. **Component Structure**: Each component exports both the main component and sub-components (e.g., Card, Card.Header, Card.Content)
2. **Type Safety**: All components are fully typed with TypeScript interfaces
3. **Bulma Integration**: Components wrap Bulma CSS classes, accepting standard Bulma props (color, size, etc.)
4. **Testing**: Every component has comprehensive unit tests using React Testing Library
5. **Stories**: Each component has Storybook stories demonstrating usage variations

### Build System

- Rollup for component library bundling (ESM and CJS outputs)
- TypeScript declarations generated in dist/types/
- Tree-shaking enabled with sideEffects: false
- Turbo for parallel builds and caching

## Quality Requirements

Before committing or creating PRs:

1. **Test Coverage**: Must maintain ≥95% coverage
2. **Type Safety**: No TypeScript errors (`npm run typecheck`)
3. **Linting**: Must pass ESLint (`npm run lint`)
4. **Formatting**: Must pass Prettier check (`npm run format:check`)
5. **Tests**: All tests must pass (`npm run test`)
6. **Storybook**: UI changes require corresponding stories
7. **Documentation**: API changes require docs updates in docs/

## Git Workflow

- Main branch: `main`
- PRs required for all changes (no direct pushes to main)
- Use conventional commits: fix:, feat:, docs:, chore:, etc.
- Semantic Release automated for npm publishing from main

## Component Development Guidelines

1. **Follow Existing Patterns**: Check similar components for consistent implementation
2. **Bulma Compliance**: Components should match Bulma CSS framework specifications
3. **Compound Components**: Use dot notation for related components (e.g., Card.Header)
4. **Props Interface**: Define clear TypeScript interfaces extending appropriate HTML element props
5. **Class Management**: Use the classNames helper and useBulmaClasses hook for class composition
6. **Accessibility**: Include proper ARIA attributes and keyboard support

## Testing Approach

- Unit tests with React Testing Library (not Enzyme)
- Test behavior, not implementation details
- Coverage requirements: statements, branches, functions, lines all ≥95%
- Mock external dependencies sparingly
- Test files located next to components or in **tests** directories
- 1, continue fixing the rest