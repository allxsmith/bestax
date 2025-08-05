---
slug: prefixed-bulma-and-theming
title: Configurable and Themeable
authors: [asmith]
tags: [release, v2, config, theme, bulma, prefix]
---

We're excited to announce version 2.0.0 of @allxsmith/bestax-bulma, bringing powerful new configuration and theming capabilities that fully embrace Bulma v1's modern approach to CSS customization.

This release introduces two major features that transform how you can customize and integrate Bulma components: **ConfigProvider** for global component configuration (including CSS class prefixing), and **Theme** for comprehensive CSS variable-based theming.

![Theming](./robot-painting.png)

With ConfigProvider, you can now globally configure all bestax-bulma components using the `useConfig` hook, enabling seamless integration with other CSS frameworks through class prefixing. The new Theme component allows you to customize Bulma's appearance using CSS variables at both global and scoped nested levels, giving you unprecedented control over your design system.

:::info[2.x.x compatible with 1.x.x]

We need to address an important note about versioning: we accidentally bumped this release to 2.0.0 instead of the intended 1.2.0. This became a major release due to a semantic-release configuration issue, when it should have been a minor release.

However, **all changes are completely backward compatible** - version 2.x.x is fully compatible with 1.x.x. We decided it's easier to move forward with the new version number rather than create confusion with republishing.

:::

<!-- truncate -->

## ConfigProvider: Global Component Configuration

The new `ConfigProvider` component addresses a critical need in modern web development: the ability to namespace CSS classes to avoid conflicts. This becomes especially important with Bulma v1's enhanced support for prefixed CSS classes.

:::tip

While not ideal, you can use prefixed css classes when integrating multiple CSS frameworks. Prefixed css classes help avoid class name collisions.

:::

### Why We Need ConfigProvider

When building applications, you may want to prefix your Bulma CSS classes with a custom namespace like "bulma-" or your own brand name. This provides better control over your CSS architecture and helps organize your styles. Bulma v1 recognized this need and now supports CSS class prefixing out of the box. While prefixing can also help in non-ideal situations where you need to integrate with other CSS frameworks like Bootstrap or Tailwind CSS, the primary benefit is having organized, namespaced CSS that follows your project's conventions.

The ConfigProvider enables you to:

- Prefix all Bulma CSS classes with a custom namespace (e.g., `bulma-`)
- Integrate seamlessly with other CSS frameworks
- Support custom Bulma builds with your own prefixes
- Maintain consistent configuration across your entire component tree

### Supporting Prefixed Bulma CSS

If you're using the official prefixed Bulma CSS file (`bulma-prefixed.min.css`), you can now use it seamlessly:

```tsx
import { ConfigProvider, Box, Title, Button } from '@allxsmith/bestax-bulma';
import 'bulma/css/versions/bulma-prefixed.min.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Box>
        <Title>Prefixed Bulma Components</Title>
        <Button color="primary">This uses bulma-button class</Button>
      </Box>
    </ConfigProvider>
  );
}
```

This renders the following HTML with prefixed CSS classes:

```html
<div class="bulma-box">
  <h1 class="bulma-title">Prefixed Bulma Components</h1>
  <button class="bulma-button bulma-is-primary">
    This uses bulma-button class
  </button>
</div>
```

### Custom Prefix Support

For teams building their own Bulma CSS with custom prefixes, you can configure your SASS build and use the same prefix in ConfigProvider:

Setup Bulma and SASS

```bash
npm install bulma sass
```

Create this custom Sass file

```scss title="src/styles/mycompany-bulma.scss"
// In your SASS build
@use 'bulma/sass' with (
  $class-prefix: 'mycompany-'
);
```

Finally, import the custom Sass file into your react entry point

```jsx title="src/index.js"
import { ConfigProvider, Box, Title, Button } from '@allxsmith/bestax-bulma';
import './styles/mycompany-bulma.scss';

function App() {
  return (
    <ConfigProvider classPrefix="mycompany-">
      <Box>
        <Title>Prefixed Bulma Components</Title>
        <Button color="primary">This uses bulma-button class</Button>
      </Box>
    </ConfigProvider>
  );
}
```

### Two CSS Frameworks Example

Here's a comprehensive example showing ConfigProvider in action with the less ideal situation: **two css frameworks coexisting together**.

```tsx
function FrameworkIntegration() {
  return (
    <div>
      {/* Bootstrap section with equivalent markup */}
      <div className="card p-4 mb-4">
        <h4 className="card-title">Bootstrap Components</h4>
        <p className="card-text">
          This section uses Bootstrap classes for styling.
        </p>
        <button className="btn btn-info">Bootstrap Button</button>
      </div>

      {/* Prefixed Bulma components to avoid conflicts */}
      <ConfigProvider classPrefix="bulma-">
        <Box>
          <Title size="4">Prefixed Components</Title>
          <p>
            All components inside this ConfigProvider will have their CSS
            classes prefixed with "bulma-", preventing conflicts with other
            frameworks.
          </p>
          <Button color="primary">Prefixed Bulma Button</Button>
        </Box>
      </ConfigProvider>
    </div>
  );
}
```

## Theme Component: CSS Variable-Based Theming

The new `Theme` component leverages CSS custom properties (CSS variables) to provide dynamic, runtime theming capabilities that were previously only possible with SASS preprocessing. This approach offers significant advantages over traditional methods.

![Runtime Theming](./themed-trees.png)

### The Power of CSS Variables vs. SASS Variables

While SASS variables are compile-time constants, CSS variables are runtime values that can be:

- Changed dynamically with JavaScript
- Inherited through the CSS cascade
- Scoped to specific DOM elements
- Modified without rebuilding your CSS

This means you can create themes that respond to user preferences, time of day, or any other runtime condition:

:::tip
These theme examples look best in dark mode. Switch to dark mode using the toggle in the top navigation for the optimal viewing experience.
:::

```tsx live
function DynamicTheming() {
  const [isLunar, setIsLunar] = useState(false);
  const [signees, setSignees] = useState([
    'John Adams',
    'Samuel Adams',
    'Benjamin Franklin',
  ]);

  const theme = React.useMemo(
    () => ({
      '--bulma-scheme-h': isLunar ? '260' : '220', // midnight: purple hue, sky: light blue hue
      '--bulma-scheme-s': isLunar ? '30%' : '90%', // midnight: muted saturation, sky: vibrant
      '--bulma-light-l': isLunar ? '8%' : '10%', // midnight: very dark, sky: very light
      '--bulma-dark-l': isLunar ? '85%' : '90%', // midnight: light text, sky: dark text
    }),
    [isLunar]
  );

  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    if (name) {
      setSignees([...signees, name]);
      e.target.reset();
    }
  };

  return (
    <Theme bulmaVars={theme} isRoot>
      <Button onClick={() => setIsLunar(!isLunar)} mb="4">
        Toggle {isLunar ? 'Lunar' : 'Midnight'} Theme
      </Button>

      <Box>
        <Columns>
          <Column>
            <Content>
              <Title size="4">A Call to Action</Title>
              <p>
                <strong>Fellow Citizens,</strong> it is with great conviction
                that we present this petition to secure the blessings of liberty
                for ourselves and our posterity. As the immortal words of our
                founding documents declare, when a long train of abuses and
                usurpations evinces a design to reduce them under absolute
                despotism, it is their right, it is their duty, to throw off
                such government.
              </p>
              <p>
                The experience of ages has proven that mankind are more disposed
                to suffer, while evils are sufferable, than to right themselves
                by abolishing the forms to which they are accustomed. But when
                circumstances compel us to action, we must not hesitate to
                secure our fundamental rights.
              </p>
              <p>
                <em>
                  Join your fellow citizens in this righteous cause. Add your
                  name to this petition and let your voice be heard in the halls
                  of justice.
                </em>
                <p>
                  <cite>-- Alexander Hamilton</cite>
                </p>
              </p>
            </Content>
          </Column>

          <Column>
            <Box>
              <Title size="5">Sign the Petition</Title>
              <form onSubmit={handleSubmit}>
                <Field label="Full Name">
                  <Control>
                    <Input
                      name="name"
                      placeholder="Enter your full name"
                      required
                    />
                  </Control>
                </Field>
                <Field label="State">
                  <Control>
                    <Input name="state" placeholder="Your state of residence" />
                  </Control>
                </Field>
                <Field>
                  <Control>
                    <Button type="submit" color="primary">
                      Add My Signature
                    </Button>
                  </Control>
                </Field>
              </form>

              <Title size="6" mt="4">
                Current Signatories
              </Title>
              <Content>
                <ul>
                  {signees.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </Content>
            </Box>
          </Column>
        </Columns>
      </Box>
    </Theme>
  );
}
```

### CSS Variables vs. Utility Classes

While utility classes like Tailwind CSS provide granular control, CSS variables offer superior theming capabilities:

- **Semantic theming**: Define color roles (primary, secondary) rather than specific colors
- **Consistent relationships**: Automatic hover/active states based on base colors
- **Global consistency**: Change one variable, update entire design system
- **Performance**: No class proliferation or CSS bloat

:::note

Tailwind CSS is a fantastic framework with CSS variable support built into it's core theming.

Tailwind CSS primarily encourages the use of utility classes over directly manipulating CSS variables for styling, as its core philosophy is "utility-first,"

:::

![Variables vs Utilities](./paint-brush-dual.png)

### Global and Scoped Theming

The Theme component supports both global theming (affecting your entire application) and scoped theming (affecting only specific sections):

#### Global Theme Example

:::tip
These theme examples look best in dark mode. Switch to dark mode using the toggle in the top navigation for the optimal viewing experience.
:::

```tsx live
function GlobalSunsetTheme() {
  const sunsetTheme = React.useMemo(
    () => ({
      '--bulma-scheme-h': '18', // sunset orange hue
      '--bulma-scheme-s': '90%',
      '--bulma-primary-h': '25',
      '--bulma-primary-s': '85%',
      '--bulma-primary-l': '55%',
    }),
    []
  );

  function App() {
    return (
      <Box>
        <Title size="3">Contact Us</Title>
        <Field label="Name">
          <Control>
            <Input placeholder="Your full name" />
          </Control>
        </Field>
        <Field label="Email">
          <Control>
            <Input type="email" placeholder="your.email@example.com" />
          </Control>
        </Field>
        <Field label="Message">
          <Control>
            <Input placeholder="How can we help you?" />
          </Control>
        </Field>
        <Field>
          <Control>
            <Button color="primary">Send Message</Button>
          </Control>
        </Field>
      </Box>
    );
  }

  return (
    <Theme bulmaVars={sunsetTheme}>
      <App /> {/* Entire app uses sunset theme */}
    </Theme>
  );
}
```

#### Scoped Theme Example

:::tip
These theme examples look best in dark mode. Switch to dark mode using the toggle in the top navigation for the optimal viewing experience.
:::

```tsx live
function ScopedTheming() {
  return (
    <div>
      <Title>Standard Theme Header</Title>

      <Block>
        <Theme primaryH="120" primaryS="100%" primaryL="40%">
          <Box>
            <Title size="4">Forest Green Section</Title>
            <Button color="primary">Green Button</Button>
          </Box>
        </Theme>
      </Block>

      <Block>
        <Theme primaryH="280" primaryS="100%" primaryL="45%">
          <Box>
            <Title size="4">Purple Section</Title>
            <Button color="primary">Purple Button</Button>
          </Box>
        </Theme>
      </Block>
    </div>
  );
}
```

### Advanced Theming with Complete Color Schemes

The Theme component supports all 500+ Bulma CSS variables, allowing for comprehensive design system customization:

:::tip
These theme examples look best in dark mode. Switch to dark mode using the toggle in the top navigation for the optimal viewing experience.
:::

```tsx live
function ForestTheme() {
  function CompleteApp() {
    return (
      <Hero size="medium">
        <Hero.Head>
          <Navbar>
            <Container>
              <Navbar.Brand>
                <Navbar.Item as="a">
                  <Title size="5">Forest Theme</Title>
                </Navbar.Item>
              </Navbar.Brand>
              <Navbar.Menu>
                <Navbar.End>
                  <Navbar.Item as="a">Getting Started</Navbar.Item>
                  <Navbar.Item as="a">Components</Navbar.Item>
                  <Navbar.Item as="a">Themes</Navbar.Item>
                  <Navbar.Item as="span">
                    <Button color="primary" isInverted>
                      Download
                    </Button>
                  </Navbar.Item>
                </Navbar.End>
              </Navbar.Menu>
            </Container>
          </Navbar>
        </Hero.Head>

        <Hero.Body>
          <Container textAlign="centered">
            <Title>Forest Green Design</Title>
            <SubTitle>Experience nature-inspired theming</SubTitle>
            <Button color="success" size="large">
              Explore Components
            </Button>
          </Container>
        </Hero.Body>

        <Hero.Foot>
          <Container>
            <Content textAlign="centered">
              <p>
                <strong>Forest Theme</strong> demonstrates comprehensive CSS
                variable theming.
              </p>
            </Content>
          </Container>
        </Hero.Foot>
      </Hero>
    );
  }

  return (
    <Theme
      schemeH="150" // forest green base
      schemeS="50%"
      lightL="80%"
      darkL="18%"
      primaryH="160"
      primaryS="60%"
      primaryL="45%"
      successH="120"
      warningH="45"
      dangerH="355"
      hoverBackgroundLDelta="4%"
      activeBackgroundLDelta="8%"
      isRoot
    >
      <CompleteApp />
    </Theme>
  );
}
```

### Combining ConfigProvider and Theme

The real power comes from combining both providers for maximum flexibility. _Okay maybe not real power per se..._

```tsx
function EnterpriseApp() {
  return (
    <ConfigProvider classPrefix="mycompany-">
      <Theme primaryH="210" primaryS="100%" primaryL="45%" isRoot>
        <App />
      </Theme>
    </ConfigProvider>
  );
}
```

## Summary: Full Bulma v1 Support

With version 2.0.0, @allxsmith/bestax-bulma now fully supports the modern concepts introduced in Bulma v1, the latest version of Bulma in 2025. Our implementation provides:

- **Complete CSS variable theming** with 500+ supported variables
- **Class prefix configuration** for framework integration
- **Runtime theme switching** capabilities
- **Scoped and global theming** options
- **TypeScript-first design** with full type safety

We're committed to continuing our support for Bulma as it evolves, and you can expect new modular configuration options in future releases of this package.

The foundation we've built with ConfigProvider and Theme components will serve as the basis for even more powerful customization features to come.

Whether you're building a simple website or a complex enterprise application, **@allxsmith/bestax-bulma** now provides the tools you need to create consistent, themeable, and maintainable user interfaces that leverage the full power of modern CSS.
