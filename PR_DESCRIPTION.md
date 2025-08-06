# Enhanced Live Code Block Theming with Shadow DOM Support

## Description

This PR significantly improves the documentation and theming support for @allxsmith/bestax-bulma v2.0.0, with a focus on enhancing live code blocks to properly demonstrate dynamic theming within shadow DOM environments.

**Packages affected:**
- [x] docs (`@allxsmith/bestax-docs`)

## Related Issue(s)

Closes #46
Closes #48

## Type of Change

- [x] Documentation
- [x] New feature  
- [x] Refactor

## Summary of Changes

### 🎨 Enhanced Shadow DOM Theming System

**Complete CodeBlock Enhancer Overhaul** (`docs/src/theme/CodeBlock/index.js`):
- Implemented comprehensive shadow DOM theming support for live code blocks
- Added `ShadowThemeContext` for isolated theme management per code block instance
- Created `ShadowTheme` component specifically for shadow DOM environments
- Added `SmartTheme` selector that automatically chooses between regular Theme and ShadowTheme
- Fixed CSS preprocessing to handle both light and dark mode properly in shadow DOM
- Ensured theme isolation - toggling themes in one live code block doesn't affect others
- Added proper color mode detection and CSS class application for shadow DOM hosts

**Key Technical Improvements**:
- CSS variables now inject correctly into shadow DOM's `:host` pseudo-element
- Media query replacement for proper light/dark mode handling in isolated shadow DOM
- Context-based theme updates ensure reactivity while maintaining isolation
- Automatic shadow DOM setup and cleanup with proper error handling

### 📝 Comprehensive v2.0.0 Blog Post

**New Blog Post** (`docs/blog/2025-08-04-prefixed-bulma-and-theming/index.md`):
- Complete documentation of ConfigProvider and Theme components
- 4 interactive live code examples demonstrating dynamic theming capabilities
- Examples include theme toggling, global theming, scoped theming, and complete color schemes
- Added user guidance tips recommending dark mode for optimal theme visibility
- Comprehensive comparison of CSS variables vs utility classes
- Integration examples showing ConfigProvider with multiple CSS frameworks

**Visual Assets**:
- Added 3 custom images illustrating theming concepts
- `robot-painting.png` - Main theming illustration
- `themed-trees.png` - Runtime theming concept
- `paint-brush-dual.png` - Variables vs utilities comparison

### 🔧 Dependencies and Configuration

**Package Updates** (`docs/package.json`):
- Upgraded `@allxsmith/bestax-bulma` dependency to v2.0.0
- Updated lock file with new dependency versions

## Live Code Examples Added

1. **Dynamic Theme Toggling**: Interactive example with Lunar/Midnight themes
2. **Global Sunset Theme**: Demonstrates application-wide theming
3. **Scoped Theming**: Shows local theme application without affecting parent
4. **Complete Color Scheme**: Advanced example with comprehensive Bulma variable customization

All examples now work properly in both light and dark modes with proper theme isolation.

## Technical Achievements

- ✅ 100% functional theme reactivity in shadow DOM
- ✅ Proper isolation between multiple live code blocks
- ✅ Support for both `isRoot` global theming and local scoped theming
- ✅ CSS variable injection into shadow DOM `:host` selector
- ✅ Automatic color mode detection and application
- ✅ Backward compatibility with existing documentation

## Testing

- [x] Verified theme toggle functionality in all live examples
- [x] Tested isolation between multiple theme examples on same page
- [x] Confirmed proper behavior in both light and dark modes
- [x] Validated CSS variable injection into shadow DOM
- [x] Tested build process and documentation generation

## Screenshots / Demos

The blog post includes 4 interactive live code examples that demonstrate:
- Real-time theme switching with proper CSS variable updates
- Theme isolation (each example maintains its own theme state)
- Both global (`isRoot`) and scoped theming patterns
- Complex color scheme customization using Bulma's 500+ CSS variables

## Additional Context

This work addresses critical issues with the documentation's live code examples not properly demonstrating the theming capabilities of bestax-bulma v2.0.0. The shadow DOM implementation was necessary to:

1. **Isolate CSS**: Prevent interference between live examples and documentation styles
2. **Enable Dynamic Theming**: Allow CSS variables to be updated at runtime
3. **Demonstrate Real Capabilities**: Show actual theming functionality rather than static examples

The implementation balances complexity with maintainability, providing a robust foundation for future documentation enhancements while ensuring all theming features work as expected in the live examples.

## Migration Notes

- No breaking changes to existing documentation
- All existing live code blocks continue to work unchanged
- New theming capabilities are opt-in through the `Theme` component usage
- Compatible with all existing bestax-bulma v2.0.0 features
