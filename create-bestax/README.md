# create-bestax

CLI tool for scaffolding new bestax-bulma projects.

## Usage

### Quick Start

```bash
# Using npm
npm create bestax@latest my-app

# Using npx
npx create-bestax@latest my-app

# Alternative naming
npm create bestax-bulma@latest my-app
```

### Interactive Mode

Running without arguments will prompt you for all options:

```bash
npm create bestax@latest
```

You'll be asked to:
1. Enter a project name
2. Select a framework (Vite or Vite + TypeScript)
3. Choose a Bulma CSS flavor (Complete or Minimal)
4. Select an icon library (Font Awesome, Material Icons, etc.)

### Command Line Options

```bash
npm create bestax@latest [project-directory] [options]
```

**Arguments:**
- `[project-directory]` - Optional project directory name

**Options:**
- `-t, --template <template>` - Template to use: `vite` or `vite-ts`  
  **Default:** `vite`
- `-b, --bulma <flavor>` - Bulma CSS flavor:
  - `complete` - Full Bulma CSS with all components and helpers
  - `prefixed` - Prefixed version for compatibility
  - `no-helpers` - Without helper classes
  - `no-helpers-prefixed` - Prefixed without helpers
  - `no-dark-mode` - Without dark mode support  
  **Default:** `complete`
- `-i, --icon <library>` - Icon library:
  - `none` - No icon library
  - `fontawesome` - Font Awesome
  - `mdi` - Material Design Icons
  - `ionicons` - Ionicons
  - `material-icons` - Material Icons
  - `material-symbols` - Material Symbols  
  **Default:** `none`
- `-y, --yes` - Skip prompts and use defaults or provided options.  
  When used, the following defaults are selected unless overridden by flags:  
  - Template: `vite`  
  - Bulma flavor: `complete`  
  - Icon library: `none`

**Example:**

```bash
# Create a TypeScript project with Font Awesome icons
npm create bestax@latest my-app -t vite-ts -i fontawesome -b complete

# Use all defaults (skip prompts)
npm create bestax@latest my-app -y
```

## Templates

Available templates:
- `vite` - Vite + JavaScript
- `vite-ts` - Vite + TypeScript

Each template includes:
- Pre-configured bestax-bulma integration
- Bulma CSS v1.0.4
- Icon library support (Font Awesome, Material Design, etc.)
- Sample components demonstrating library usage
- Development and build scripts

## Development

```bash
npm run build    # Build the CLI
npm run dev      # Watch mode
npm test         # Run tests
```

## Publishing

This package uses semantic-release with scope-based rules. Only commits with `feat(create-bestax)` or `fix(create-bestax)` will trigger releases.
