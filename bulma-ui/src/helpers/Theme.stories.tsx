import { Theme } from './Theme';
import Box from '../elements/Box';
import Title from '../elements/Title';
import Button from '../elements/Button';

export default {
  title: 'Helpers/Theme',
  component: Theme,
};

// Sunset-inspired scheme variables (full list)
const sunsetSchemeVars = {
  '--bulma-scheme-h': '18', // sunset orange hue
  '--bulma-scheme-s': '90%',
  '--bulma-light-l': '85%', // light backgrounds
  '--bulma-light-invert-l': '15%', // invert for light backgrounds
  '--bulma-dark-l': '20%', // dark backgrounds
  '--bulma-dark-invert-l': '80%', // invert for dark backgrounds
  '--bulma-soft-l': '60%', // soft colors
  '--bulma-bold-l': '40%', // bold colors
  '--bulma-soft-invert-l': '80%', // invert for soft colors
  '--bulma-bold-invert-l': '60%', // invert for bold colors
  '--bulma-hover-background-l-delta': '5%',
  '--bulma-active-background-l-delta': '10%',
  '--bulma-hover-border-l-delta': '10%',
  '--bulma-active-border-l-delta': '20%',
  '--bulma-hover-color-l-delta': '5%',
  '--bulma-active-color-l-delta': '10%',
  '--bulma-hover-shadow-a-delta': '0.1',
  '--bulma-active-shadow-a-delta': '0.2',
};

export const SunsetTheme = () => (
  <Theme bulmaVars={sunsetSchemeVars} isRoot>
    <Box>
      <Title size="3">Sunset Theme by setting css vars</Title>
      <p>
        <strong>Example:</strong> This demonstrates using the{' '}
        <code>bulmaVars</code> prop with <code>isRoot=true</code> to inject
        Bulma scheme variables globally at the :root level.
      </p>
      <p>
        This box uses a sunset-inspired Bulma theme constructed using only
        scheme variables, similar to Bulma&apos;s dark theme approach. The
        variables are applied globally, affecting all Bulma components on the
        page.
      </p>
      <p>
        <strong>Variables set:</strong> scheme-h, scheme-s, light/dark lightness
        levels, soft/bold colors, and hover/active deltas for consistent theming
        across all components.
      </p>
    </Box>

    <Box mt="4">
      <Title size="4">Variables Object</Title>
      <p>
        The <code>sunsetSchemeVars</code> object passed to the{' '}
        <code>bulmaVars</code> prop:
      </p>
      <pre
        style={{
          fontSize: '0.75rem',
          padding: '1rem',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {`const sunsetSchemeVars = {
  '--bulma-scheme-h': '18',
  '--bulma-scheme-s': '90%',
  '--bulma-light-l': '85%',
  '--bulma-light-invert-l': '15%',
  '--bulma-dark-l': '20%',
  '--bulma-dark-invert-l': '80%',
  '--bulma-soft-l': '60%',
  '--bulma-bold-l': '40%',
  '--bulma-soft-invert-l': '80%',
  '--bulma-bold-invert-l': '60%',
  '--bulma-hover-background-l-delta': '5%',
  '--bulma-active-background-l-delta': '10%',
  '--bulma-hover-border-l-delta': '10%',
  '--bulma-active-border-l-delta': '20%',
  '--bulma-hover-color-l-delta': '5%',
  '--bulma-active-color-l-delta': '10%',
  '--bulma-hover-shadow-a-delta': '0.1',
  '--bulma-active-shadow-a-delta': '0.2',
};

<Theme bulmaVars={sunsetSchemeVars} isRoot>
  {/* children */}
</Theme>`}
      </pre>
    </Box>

    <Box mt="4">
      <Title size="4">Generated CSS</Title>
      <p>
        This Theme component generates the following CSS variables at the :root
        level:
      </p>
      <pre
        style={{
          fontSize: '0.75rem',
          padding: '1rem',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {`:root {
  --bulma-scheme-h: 18;
  --bulma-scheme-s: 90%;
  --bulma-light-l: 85%;
  --bulma-light-invert-l: 15%;
  --bulma-dark-l: 20%;
  --bulma-dark-invert-l: 80%;
  --bulma-soft-l: 60%;
  --bulma-bold-l: 40%;
  --bulma-soft-invert-l: 80%;
  --bulma-bold-invert-l: 60%;
  --bulma-hover-background-l-delta: 5%;
  --bulma-active-background-l-delta: 10%;
  --bulma-hover-border-l-delta: 10%;
  --bulma-active-border-l-delta: 20%;
  --bulma-hover-color-l-delta: 5%;
  --bulma-active-color-l-delta: 10%;
  --bulma-hover-shadow-a-delta: 0.1;
  --bulma-active-shadow-a-delta: 0.2;
}`}
      </pre>
    </Box>
  </Theme>
);

// Forest-inspired scheme variables (full list, as props)
const forestSchemeObj = {
  schemeH: '150', // forest green hue
  schemeS: '50%',
  lightL: '80%', // light backgrounds
  lightInvertL: '20%', // invert for light backgrounds
  darkL: '18%', // dark backgrounds
  darkInvertL: '85%', // invert for dark backgrounds
  softL: '55%', // soft colors
  boldL: '35%', // bold colors
  softInvertL: '75%', // invert for soft colors
  boldInvertL: '60%', // invert for bold colors
  hoverBackgroundLDelta: '4%',
  activeBackgroundLDelta: '8%',
  hoverBorderLDelta: '8%',
  activeBorderLDelta: '16%',
  hoverColorLDelta: '4%',
  activeColorLDelta: '8%',
  hoverShadowADelta: '0.08',
  activeShadowADelta: '0.16',
  primaryH: '10',
};

export const ForestTheme = () => (
  <Theme {...forestSchemeObj} isRoot>
    <Box>
      <Title size="3">Forest Theme by setting props</Title>
      <p>
        <strong>Example:</strong> This demonstrates using individual Bulma
        variable props with <code>isRoot=true</code> to set scheme variables
        globally at the :root level.
      </p>
      <p>
        This box uses a forest-inspired Bulma theme constructed using individual
        prop names instead of the <code>bulmaVars</code> object. The theme
        variables are applied globally, creating a consistent forest-green color
        scheme across all components.
      </p>
      <p>
        <strong>Props used:</strong> schemeH, schemeS, lightL, darkL, softL,
        boldL, primaryH, and various hover/active deltas. This approach allows
        for more explicit prop definition in your JSX.
      </p>
    </Box>

    <Box mt="4">
      <Title size="4">JSX Code</Title>
      <p>
        This Theme component uses the following JSX props to set CSS variables:
      </p>
      <pre
        style={{
          fontSize: '0.75rem',
          padding: '1rem',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {`<Theme
  schemeH="150"
  schemeS="50%"
  lightL="80%"
  lightInvertL="20%"
  darkL="18%"
  darkInvertL="85%"
  softL="55%"
  boldL="35%"
  softInvertL="75%"
  boldInvertL="60%"
  hoverBackgroundLDelta="4%"
  activeBackgroundLDelta="8%"
  hoverBorderLDelta="8%"
  activeBorderLDelta="16%"
  hoverColorLDelta="4%"
  activeColorLDelta="8%"
  hoverShadowADelta="0.08"
  activeShadowADelta="0.16"
  primaryH="10"
  isRoot
>
  {/* children */}
</Theme>`}
      </pre>
    </Box>
  </Theme>
);

// Demonstration of global vs local CSS variable injection
export const GlobalTheme = () => (
  <div>
    <Title size="3">Global Theme (isRoot=true)</Title>
    <p>When isRoot=true, CSS variables are injected globally at :root level.</p>

    <Theme isRoot={true} primaryH="270" primaryS="100%" primaryL="50%">
      <div>
        <Button color="primary">Global Purple Primary Button</Button>
        <p>This button inherits the global purple theme.</p>
      </div>
    </Theme>

    <div style={{ marginTop: '20px' }}>
      <Button color="primary">
        This button also uses the global purple theme
      </Button>
      <p>
        Even outside the Theme component, this button still has the purple theme
        because it was applied globally.
      </p>
    </div>
  </div>
);

export const LocalTheme = () => (
  <div>
    <Title size="3">Local Theme (isRoot=false, default)</Title>
    <p>
      When isRoot=false (default), CSS variables are applied only to the
      wrapping div.
    </p>

    <Theme primaryH="120" primaryS="100%" primaryL="40%">
      <div>
        <Button color="primary">Local Green Primary Button</Button>
        <p>This button gets the local green theme.</p>
      </div>
    </Theme>

    <div style={{ marginTop: '20px' }}>
      <Button color="primary">This button uses the default theme</Button>
      <p>
        Outside the Theme component, this button uses the default Bulma theme.
      </p>
    </div>
  </div>
);

// Demonstration of className and Bulma helper classes
export const ThemeWithClassName = () => (
  <div>
    <Title size="3">Theme with className and Bulma Classes</Title>
    <p>
      This demonstrates using className and Bulma helper classes with the Theme
      component.
    </p>

    <Theme
      className="custom-theme-wrapper"
      primaryH="45"
      primaryS="100%"
      primaryL="50%"
      p="5"
      m="3"
      textAlign="centered"
    >
      <Title size="4">Styled Theme Wrapper</Title>
      <p>
        This Theme component has custom className, padding, margin, and text
        alignment applied via Bulma helper classes.
      </p>
      <Button color="primary">Orange Primary Button</Button>
    </Theme>

    <Theme
      className="another-wrapper"
      primaryH="200"
      primaryS="80%"
      primaryL="60%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      p="4"
      mt="4"
    >
      <Title size="4">Flexbox Theme Wrapper</Title>
      <p>This wrapper uses flexbox layout with centered content.</p>
      <Button color="info">Cyan Info Button</Button>
    </Theme>
  </div>
);

// Multiple nested themes with different classes
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import Input from '../form/Input';
import { Buttons } from '../elements/Buttons';

export const NestedThemes = () => (
  <div>
    <Title size="3">Nested Themes: Federalist Papers Collection</Title>
    <p>
      This demonstrates nested Theme components with different color schemes,
      typography, and interactive elements using excerpts from the Federalist
      Papers.
    </p>

    <Theme
      className="outer-theme"
      primaryH="210"
      primaryS="60%"
      primaryL="45%"
      infoH="195"
      infoS="70%"
      infoL="50%"
      p="4"
      fontFamily="sans-serif"
    >
      <Columns>
        <Column size="one-third">
          <Box p="4">
            <Title size="4">Federalist No. 1</Title>
            <p>
              &ldquo;AFTER an unequivocal experience of the inefficiency of the
              subsisting federal government, you are called upon to deliberate
              on a new Constitution for the United States of America. The
              subject speaks its own importance; comprehending in its
              consequences nothing less than the existence of the
              UNION&hellip;&rdquo;
            </p>
            <Button color="primary" size="small" mt="3">
              Read Hamilton&apos;s Essay
            </Button>
            <Input placeholder="Search Federalist 1..." mt="3" size="small" />
          </Box>
        </Column>

        <Column size="one-third">
          <Theme
            className="inner-theme-madison"
            primaryH="150"
            primaryS="80%"
            primaryL="40%"
            infoH="45"
            infoS="85%"
            infoL="55%"
            warningH="25"
            warningS="90%"
            warningL="50%"
            fontFamily="primary"
          >
            <Box p="4">
              <Title size="4">Federalist No. 10</Title>
              <p>
                &ldquo;AMONG the numerous advantages promised by a well
                constructed Union, none deserves to be more accurately developed
                than its tendency to break and control the violence of faction.
                The friend of popular governments never finds himself so much
                alarmed for their character and fate, as when he contemplates
                their propensity to this dangerous vice&hellip;&rdquo;
              </p>
              <Buttons mt="3">
                <Button color="primary" size="small">
                  Madison&apos;s Wisdom
                </Button>
                <Button color="info" size="small">
                  Faction Control
                </Button>
                <Button color="warning" size="small">
                  Popular Government
                </Button>
              </Buttons>
              <Input placeholder="Explore factions..." mt="3" size="small" />
            </Box>
          </Theme>
        </Column>

        <Column size="one-third">
          <Theme
            className="inner-theme-jay"
            primaryH="280"
            primaryS="75%"
            primaryL="35%"
            infoH="320"
            infoS="60%"
            infoL="45%"
            successH="120"
            successS="70%"
            successL="40%"
            fontFamily="monospace"
          >
            <Box p="4">
              <Title size="4">Federalist No. 2</Title>
              <p>
                &ldquo;WHEN the people of America reflect that they are now
                called upon to decide a question, which, in its consequences,
                must prove one of the most important that ever engaged their
                attention, the propriety of their taking a very comprehensive,
                as well as a very serious, view of it, will be
                evident&hellip;&rdquo;
              </p>
              <Buttons mt="3">
                <Button color="primary" size="small">
                  Jay&apos;s Perspective
                </Button>
                <Button color="info" size="small">
                  Union Benefits
                </Button>
                <Button color="success" size="small">
                  National Unity
                </Button>
              </Buttons>
              <Input
                placeholder="Constitutional queries..."
                mt="3"
                size="small"
              />
            </Box>
          </Theme>
        </Column>
      </Columns>

      <Box mt="5" p="4" textAlign="centered">
        <Title size="5">Comparative Analysis</Title>
        <p>
          Each column demonstrates a different nested theme with unique color
          palettes representing the distinct voices of Hamilton, Madison, and
          Jay. Notice how the typography and interactive elements adapt to each
          theme&apos;s aesthetic.
        </p>
        <Buttons isCentered mt="3">
          <Button color="primary">View All Papers</Button>
          <Button color="info">Historical Context</Button>
        </Buttons>
      </Box>
    </Theme>
  </div>
);

// ConfigProvider with Theme for Bulma-prefixed usage
import { ConfigProvider } from './Config';

export const BulmaPrefixedTheme = () => (
  <div>
    <Title size="3">Theme with Bulma Class Prefix</Title>
    <p>
      <strong>Example:</strong> This demonstrates using ConfigProvider to inject
      a &quot;bulma-&quot; prefix for Bulma prefixed usage, combined with Theme
      for CSS variable theming.
    </p>
    <p>
      This approach is useful when you need to use Bulma alongside other CSS
      frameworks or when you want to namespace all Bulma classes to avoid
      conflicts. The ConfigProvider injects &quot;bulma-&quot; prefix to all
      component classes.
    </p>

    <ConfigProvider classPrefix="bulma-">
      <Theme
        primaryH="280"
        primaryS="100%"
        primaryL="45%"
        p="4"
        textAlign="centered"
      >
        <Title size="4">Bulma-Prefixed Components</Title>
        <p>
          All components inside this ConfigProvider will have their CSS classes
          prefixed with &quot;bulma-&quot; (e.g., &quot;bulma-button&quot;,
          &quot;bulma-title&quot;, &quot;bulma-box&quot;).
        </p>
        <Button color="primary">Prefixed Purple Button</Button>

        <Box mt="3">
          <p>
            <strong>Use case:</strong> This is particularly useful for
            micro-frontends, component libraries, or when integrating Bulma with
            other CSS frameworks that might have conflicting class names.
          </p>
        </Box>
      </Theme>
    </ConfigProvider>

    <div style={{ marginTop: '20px' }}>
      <Title size="4">Standard Components (No Prefix)</Title>
      <p>
        Components outside the ConfigProvider use standard Bulma classes without
        any prefix.
      </p>
      <Button color="info">Standard Info Button</Button>
    </div>
  </div>
);
