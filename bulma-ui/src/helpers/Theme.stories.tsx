import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Theme, type ThemeProps } from './Theme';
import { ConfigProvider } from './Config';
import { Block } from '../elements/Block';
import Box from '../elements/Box';
import Title from '../elements/Title';
import Button from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Notification } from '../elements/Notification';
import { Paragraph } from '../elements/Paragraph';
import { Tag } from '../elements/Tag';
import { Tags } from '../elements/Tags';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';

const meta: Meta<typeof Theme> = {
  title: 'Helpers/Theme',
  component: Theme,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

/**
 * A story whose Theme writes to `:root` or `<html>` reaches the whole page,
 * so on the docs page each one renders in a frame of its own, where it can't
 * recolor the stories around it.
 */
const ownFrame = (iframeHeight: number) => ({
  docs: { story: { inline: false, iframeHeight } },
});

/** A variables object as you'd write it in your code. */
const objectSource = (name: string, vars: Record<string, string>) =>
  [
    `const ${name} = {`,
    ...Object.entries(vars).map(([key, value]) => `  '${key}': '${value}',`),
    '};',
  ].join('\n');

/** The `:root` rule a root Theme writes for plain values, one to a line. */
const rootRule = (vars: Record<string, string>) =>
  [
    ':root {',
    ...Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`),
    '}',
  ].join('\n');

// Sunset: amber, coral, rose and violet on warm neutrals. A color's trio
// leaves its label lightness where the stylesheet's build put it, so each
// color sets `--bulma-<color>-invert-l` as well: white on the three deeper
// colors, near black on the amber.
const sunsetVars = {
  '--bulma-scheme-h': '24',
  '--bulma-scheme-s': '22%',
  '--bulma-primary-h': '12',
  '--bulma-primary-s': '76%',
  '--bulma-primary-l': '44%',
  '--bulma-primary-invert-l': '100%',
  '--bulma-link-h': '340',
  '--bulma-link-s': '62%',
  '--bulma-link-l': '48%',
  '--bulma-link-invert-l': '100%',
  '--bulma-info-h': '262',
  '--bulma-info-s': '52%',
  '--bulma-info-l': '56%',
  '--bulma-info-invert-l': '100%',
  '--bulma-warning-h': '38',
  '--bulma-warning-s': '95%',
  '--bulma-warning-l': '54%',
  '--bulma-warning-invert-l': '10%',
} satisfies ThemeProps['bulmaVars'];

/**
 * A palette set through one `bulmaVars` object. With `isRoot`, Theme writes
 * the variables at `:root`, so every component on the page takes them.
 */
export const SunsetTheme: Story = {
  parameters: ownFrame(1100),
  render: () => (
    <Theme bulmaVars={sunsetVars} isRoot>
      <Box>
        <Title size="3">Sunset</Title>
        <Paragraph mb="4">
          Amber, coral, rose and violet on warm neutrals, set through the{' '}
          <code>bulmaVars</code> prop. With <code>isRoot</code>, Theme writes
          the variables at <code>:root</code>, so every component on the page
          takes them, not only the ones inside this Theme.
        </Paragraph>
        <Buttons>
          <Button color="primary">Primary</Button>
          <Button color="link">Link</Button>
          <Button color="info">Info</Button>
          <Button color="warning">Warning</Button>
        </Buttons>
        <Tags>
          <Tag color="primary" isLight>
            Primary
          </Tag>
          <Tag color="link" isLight>
            Link
          </Tag>
          <Tag color="info" isLight>
            Info
          </Tag>
          <Tag color="warning" isLight>
            Warning
          </Tag>
        </Tags>
        <Paragraph>
          Each color sets its label lightness, <code>--bulma-*-invert-l</code>,
          as well as its hue, saturation and lightness, so the buttons keep
          readable labels. A theme that colors text on the page, such as links,
          sets <code>--bulma-*-on-scheme-l</code> too, as Label And Text
          Lightness shows.
        </Paragraph>
      </Box>
      <Columns>
        <Column display="flex" flexDirection="column">
          <Box flexGrow="1">
            <Title size="5">Variables object</Title>
            <Paragraph mb="3">
              The object passed to <code>bulmaVars</code>:
            </Paragraph>
            <pre>
              {objectSource('sunsetVars', sunsetVars)}
              {
                '\n\n<Theme bulmaVars={sunsetVars} isRoot>\n  {/* children */}\n</Theme>'
              }
            </pre>
          </Box>
        </Column>
        <Column display="flex" flexDirection="column">
          <Box flexGrow="1">
            <Title size="5">Generated CSS</Title>
            <Paragraph mb="3">
              What Theme writes at <code>:root</code>:
            </Paragraph>
            <pre>{rootRule(sunsetVars)}</pre>
          </Box>
        </Column>
      </Columns>
    </Theme>
  ),
};

// Forest: pine, lake, fern, ochre and berry on cool green neutrals, set
// through the named props. Label lightnesses have no named prop, so they go
// through bulmaVars alongside them.
const forestProps = {
  schemeH: '140',
  schemeS: '16%',
  primaryH: '152',
  primaryS: '50%',
  primaryL: '32%',
  linkH: '195',
  linkS: '65%',
  linkL: '34%',
  successH: '95',
  successS: '40%',
  successL: '33%',
  warningH: '36',
  warningS: '85%',
  warningL: '52%',
  dangerH: '352',
  dangerS: '60%',
  dangerL: '48%',
} satisfies Partial<ThemeProps>;

const forestLabels = {
  '--bulma-primary-invert-l': '100%',
  '--bulma-link-invert-l': '100%',
  '--bulma-success-invert-l': '100%',
  '--bulma-warning-invert-l': '10%',
  '--bulma-danger-invert-l': '100%',
} satisfies ThemeProps['bulmaVars'];

const forestSource = [
  '<Theme',
  ...Object.entries(forestProps).map(([prop, value]) => `  ${prop}="${value}"`),
  '  bulmaVars={{',
  ...Object.entries(forestLabels).map(
    ([key, value]) => `    '${key}': '${value}',`
  ),
  '  }}',
  '  isRoot',
  '>',
  '  {/* children */}',
  '</Theme>',
].join('\n');

/**
 * The same kind of palette set through Theme's named props, one per
 * variable, such as `primaryH` for `--bulma-primary-h`.
 */
export const ForestTheme: Story = {
  parameters: ownFrame(1100),
  render: () => (
    <Theme {...forestProps} bulmaVars={forestLabels} isRoot>
      <Box>
        <Title size="3">Forest</Title>
        <Paragraph mb="4">
          Pine, lake, fern, ochre and berry on cool green neutrals, set through
          Theme&apos;s named props, such as <code>primaryH</code> for{' '}
          <code>--bulma-primary-h</code>, with <code>isRoot</code>. The label
          lightnesses have no named prop, so they go through{' '}
          <code>bulmaVars</code> beside them.
        </Paragraph>
        <Buttons>
          <Button color="primary">Primary</Button>
          <Button color="link">Link</Button>
          <Button color="success">Success</Button>
          <Button color="warning">Warning</Button>
          <Button color="danger">Danger</Button>
        </Buttons>
        <Tags>
          <Tag color="primary" isLight>
            Primary
          </Tag>
          <Tag color="link" isLight>
            Link
          </Tag>
          <Tag color="success" isLight>
            Success
          </Tag>
          <Tag color="warning" isLight>
            Warning
          </Tag>
          <Tag color="danger" isLight>
            Danger
          </Tag>
        </Tags>
      </Box>
      <Box>
        <Title size="5">JSX</Title>
        <Paragraph mb="3">The props this Theme takes:</Paragraph>
        <pre>{forestSource}</pre>
      </Box>
    </Theme>
  ),
};

const violet = { primaryH: '262', primaryS: '52%', primaryL: '56%' };
const whiteLabel = {
  '--bulma-primary-invert-l': '100%',
} satisfies ThemeProps['bulmaVars'];

/**
 * With `isRoot`, the variables apply at `:root`, so a button outside the
 * Theme takes them too.
 */
export const GlobalTheme: Story = {
  parameters: ownFrame(320),
  render: () => (
    <div>
      <Title size="3">Global Theme (isRoot)</Title>
      <Paragraph mb="4">
        With <code>isRoot</code>, Theme writes its variables at{' '}
        <code>:root</code>, so they reach the whole page.
      </Paragraph>

      <Theme isRoot {...violet} bulmaVars={whiteLabel}>
        <Button color="primary">Inside the Theme</Button>
        <Paragraph mt="2">This button takes the violet primary.</Paragraph>
      </Theme>

      <Block mt="5">
        <Button color="primary">Outside the Theme</Button>
        <Paragraph mt="2">
          This one sits outside the Theme and takes the violet primary too,
          since it was set at <code>:root</code>.
        </Paragraph>
      </Block>
    </div>
  ),
};

/**
 * Without `isRoot`, the variables apply to Theme's wrapper div and what is
 * inside it.
 */
export const LocalTheme: Story = {
  render: () => (
    <div>
      <Title size="3">Local Theme (the default)</Title>
      <Paragraph mb="4">
        Without <code>isRoot</code>, Theme writes its variables on its wrapper
        div, so only what is inside it takes them.
      </Paragraph>

      <Theme
        primaryH="158"
        primaryS="64%"
        primaryL="30%"
        bulmaVars={whiteLabel}
      >
        <Button color="primary">Inside the Theme</Button>
        <Paragraph mt="2">This button takes the emerald primary.</Paragraph>
      </Theme>

      <Block mt="5">
        <Button color="primary">Outside the Theme</Button>
        <Paragraph mt="2">
          This one sits outside the Theme and keeps the stylesheet&apos;s
          primary.
        </Paragraph>
      </Block>
    </div>
  ),
};

/**
 * A scoped Theme's wrapper takes `className` and the helper props. Bulma's
 * soft and bold color helpers read the primary hue on the element they are
 * on, so as the className here they tint each panel and its text with its
 * own Theme's primary, a light panel on the light scheme and a dark one on
 * the dark scheme.
 */
export const ThemeWithClassName: Story = {
  render: () => (
    <div>
      <Title size="3">Theme with className and helper props</Title>
      <Paragraph mb="4">
        A scoped Theme renders a wrapper div, and <code>className</code> and the
        helper props land on it.
      </Paragraph>

      <Theme
        className="has-background-primary-soft has-text-primary-bold"
        primaryH="40"
        primaryS="92%"
        primaryL="52%"
        bulmaVars={{ '--bulma-primary-invert-l': '10%' }}
        p="5"
        m="3"
        radius="large"
        textAlign="centered"
      >
        <Title size="4">Amber panel</Title>
        <Paragraph mb="4">
          Bulma&apos;s <code>has-background-primary-soft</code> and{' '}
          <code>has-text-primary-bold</code>, given as <code>className</code>,
          tint the wrapper and its text with this Theme&apos;s amber. The{' '}
          <code>p</code>, <code>m</code>, <code>radius</code> and{' '}
          <code>textAlign</code> props pad, space, round and center it.
        </Paragraph>
        <Button color="primary">Amber primary</Button>
      </Theme>

      <Theme
        className="has-background-primary-soft has-text-primary-bold"
        primaryH="205"
        primaryS="78%"
        primaryL="39%"
        bulmaVars={whiteLabel}
        display="flex"
        flexDirection="column"
        alignItems="center"
        p="5"
        m="3"
        radius="large"
      >
        <Title size="4">Sky panel</Title>
        <Paragraph mb="4">
          The same classes with a sky-blue primary, and the flex helper props
          stacking and centering the content.
        </Paragraph>
        <Button color="primary">Sky primary</Button>
      </Theme>
    </div>
  ),
};

/**
 * An inner Theme sets only what it changes and takes the rest from the
 * Theme around it.
 */
export const NestedThemes: Story = {
  render: () => (
    <div>
      <Title size="3">Nested Themes: The Federalist Papers</Title>
      <Paragraph mb="4">
        The outer Theme sets an ink-blue primary and a slate info for the whole
        collection. Madison&apos;s and Jay&apos;s essays each sit in an inner
        Theme that sets only a primary of its own, so their info tags stay
        slate, from the outer Theme.
      </Paragraph>

      <Theme
        primaryH="218"
        primaryS="52%"
        primaryL="48%"
        infoH="205"
        infoS="28%"
        infoL="42%"
        bulmaVars={{
          '--bulma-primary-invert-l': '100%',
          '--bulma-info-invert-l': '100%',
        }}
      >
        <Columns>
          <Column display="flex" flexDirection="column">
            <Box flexGrow="1">
              <Tag color="info" mb="3">
                Hamilton
              </Tag>
              <Title size="4">Federalist No. 1</Title>
              <Paragraph mb="4">
                &ldquo;AFTER an unequivocal experience of the inefficiency of
                the subsisting federal government, you are called upon to
                deliberate on a new Constitution for the United States of
                America. The subject speaks its own importance; comprehending in
                its consequences nothing less than the existence of the
                UNION&hellip;&rdquo;
              </Paragraph>
              <Button color="primary">Read No. 1</Button>
            </Box>
          </Column>

          <Column display="flex" flexDirection="column">
            <Theme
              primaryH="350"
              primaryS="55%"
              primaryL="48%"
              bulmaVars={{ '--bulma-primary-invert-l': '100%' }}
              display="flex"
              flexDirection="column"
              flexGrow="1"
            >
              <Box flexGrow="1">
                <Tag color="info" mb="3">
                  Madison
                </Tag>
                <Title size="4">Federalist No. 10</Title>
                <Paragraph mb="4">
                  &ldquo;AMONG the numerous advantages promised by a well
                  constructed Union, none deserves to be more accurately
                  developed than its tendency to break and control the violence
                  of faction. The friend of popular governments never finds
                  himself so much alarmed for their character and fate, as when
                  he contemplates their propensity to this dangerous
                  vice&hellip;&rdquo;
                </Paragraph>
                <Button color="primary">Read No. 10</Button>
              </Box>
            </Theme>
          </Column>

          <Column display="flex" flexDirection="column">
            <Theme
              primaryH="160"
              primaryS="45%"
              primaryL="32%"
              bulmaVars={{ '--bulma-primary-invert-l': '100%' }}
              display="flex"
              flexDirection="column"
              flexGrow="1"
            >
              <Box flexGrow="1">
                <Tag color="info" mb="3">
                  Jay
                </Tag>
                <Title size="4">Federalist No. 2</Title>
                <Paragraph mb="4">
                  &ldquo;WHEN the people of America reflect that they are now
                  called upon to decide a question, which, in its consequences,
                  must prove one of the most important that ever engaged their
                  attention, the propriety of their taking a very comprehensive,
                  as well as a very serious, view of it, will be
                  evident&hellip;&rdquo;
                </Paragraph>
                <Button color="primary">Read No. 2</Button>
              </Box>
            </Theme>
          </Column>
        </Columns>

        <Box textAlign="centered">
          <Title size="5">The whole collection</Title>
          <Paragraph mb="4">
            Outside the inner Themes, the outer Theme&apos;s ink blue and slate
            apply.
          </Paragraph>
          <Buttons isCentered>
            <Button color="primary">Browse the essays</Button>
            <Button color="info">About the authors</Button>
          </Buttons>
        </Box>
      </Theme>
    </div>
  ),
};

/**
 * Under a `ConfigProvider` class prefix, Theme sets the same `--bulma-*`
 * variables, and the prefixed stylesheet's components read them.
 */
export const BulmaPrefixedTheme: Story = {
  render: () => (
    <div>
      <Title size="3">Theme with a class prefix</Title>
      <Paragraph mb="4">
        <code>ConfigProvider</code> gives every component inside it the{' '}
        <code>bestax-</code> class prefix, for a page that loads bestax&apos;s
        prefixed stylesheet beside other CSS. Theme works the same inside it:
        the variables keep their <code>--bulma-</code> names.
      </Paragraph>

      <ConfigProvider classPrefix="bestax-">
        <Theme
          primaryH="236"
          primaryS="55%"
          primaryL="58%"
          bulmaVars={whiteLabel}
          p="4"
          textAlign="centered"
        >
          <Title size="4">Prefixed components</Title>
          <Paragraph mb="4">
            These render <code>bestax-button</code>, <code>bestax-title</code>{' '}
            and <code>bestax-box</code>, themed with an indigo primary.
          </Paragraph>
          <Button color="primary">Indigo primary</Button>

          <Box mt="4">
            <strong>Use case:</strong> micro-frontends, component libraries, or
            a page where another CSS framework uses the same class names.
          </Box>
        </Theme>
      </ConfigProvider>

      <Block mt="5">
        <Title size="4">Standard components (no prefix)</Title>
        <Paragraph mb="4">
          Outside the <code>ConfigProvider</code>, components use Bulma&apos;s
          plain class names and the stylesheet&apos;s colors.
        </Paragraph>
        <Button color="info">Standard info button</Button>
      </Block>
    </div>
  ),
};

// Shadow: <Theme bulmaVars={{ '--bulma-shadow': ... }}> overrides the upstream
// token that `.box`/`.card` derive their own shadow variable from, so the ring
// cascades into descendant Boxes/Cards. The class-based `shadow="shadowless"`
// prop is unaffected: it still emits `is-shadowless` rather than a CSS var.
export const CustomShadow: Story = {
  render: () => (
    <Theme bulmaVars={{ '--bulma-shadow': '0 0 0 3px var(--bulma-primary)' }}>
      <Title size="3">Custom shadow via --bulma-shadow</Title>
      <Paragraph mb="4">
        Passing <code>--bulma-shadow</code> through <code>bulmaVars</code>{' '}
        overrides the upstream token that <code>.box</code> derives its{' '}
        <code>--bulma-box-shadow</code> from, so the primary ring cascades into
        every descendant Box.
      </Paragraph>
      <Box>
        <Title size="5">Featured Box</Title>
        <p>This Box inherits the custom primary-ring shadow from the Theme.</p>
      </Box>
      <Box mt="4" shadow="shadowless">
        <Title size="5">Shadowless Box</Title>
        <p>
          This Box sets <code>shadow=&quot;shadowless&quot;</code>, which still
          emits the <code>is-shadowless</code> helper class and opts out of the
          cascaded ring.
        </p>
      </Box>
    </Theme>
  ),
};

// Radius: `radius` on Theme is the border radius helper, as on every other
// component, so a custom `--bulma-radius` goes through `bulmaVars`.
// Notification and Tag declare their own radius from it, so a scoped override
// reaches them; controls resolve theirs at :root and need an isRoot Theme.
export const RadiusTheme: Story = {
  render: () => (
    <Theme bulmaVars={{ '--bulma-radius': '1rem' }}>
      <Title size="3">Custom radius via --bulma-radius</Title>
      <Paragraph mb="4">
        Passing <code>--bulma-radius</code> through <code>bulmaVars</code>{' '}
        rounds the Notification and Tag below. The <code>radius</code> prop is
        the border radius helper here too:{' '}
        <code>&lt;Theme radius=&quot;radiusless&quot;&gt;</code> adds{' '}
        <code>is-radiusless</code> to the wrapper and sets{' '}
        <code>--bulma-radius</code> to 0, squaring what is inside it.
      </Paragraph>
      <Notification color="primary">A rounder notification.</Notification>
      <Tag color="info">Rounder tag</Tag>
    </Theme>
  ),
};

// Label and text lightnesses: a trio recolors the color, but the label on a
// solid surface (--bulma-<color>-invert-l) and the color's text on the page
// (--bulma-<color>-on-scheme-l) keep the lightnesses the stylesheet was built
// with, for bestax's dark blue. Stock Bulma's turquoise is light, so it sets
// a dark label, and text lightnesses that read on a light page and on a dark
// one. A value per scheme needs an isRoot Theme.
export const LabelAndTextLightness: Story = {
  parameters: ownFrame(320),
  render: () => (
    <Theme
      isRoot
      primaryH="171deg"
      primaryS="100%"
      primaryL="41%"
      bulmaVars={{
        '--bulma-primary-invert-l': 'var(--bulma-primary-05-l)',
        '--bulma-primary-on-scheme-l': { light: '21%', dark: '41%' },
      }}
    >
      <Box>
        <Title size="4">Stock Bulma turquoise</Title>
        <Paragraph mb="4">
          The trio sets the turquoise, <code>--bulma-primary-invert-l</code>{' '}
          gives the button and tag a dark label, and{' '}
          <code>--bulma-primary-on-scheme-l</code> takes one lightness per
          scheme for the text below, so it reads in light and dark mode.
        </Paragraph>
        <Buttons>
          <Button color="primary">Save</Button>
          <Tag color="primary">New</Tag>
        </Buttons>
        <Block textColor="primary" colorShade="on-scheme">
          Turquoise text on the page.
        </Block>
      </Box>
    </Theme>
  ),
};

// Dark mode: <Theme colorMode> writes the `data-theme` attribute on <html>,
// flipping Bulma's light/dark scheme globally. `'system'` follows the OS.
export const DarkMode: Story = {
  parameters: ownFrame(260),
  render: function DarkModeExample() {
    const [mode, setMode] = useState<'light' | 'dark' | 'system'>('light');
    return (
      <Theme colorMode={mode}>
        <Box>
          <Title size="4">Color mode: {mode}</Title>
          <Paragraph mb="4">
            The <code>colorMode</code> prop sets <code>data-theme</code> on{' '}
            <code>&lt;html&gt;</code>, so every component follows the active
            scheme.
          </Paragraph>
          <Buttons>
            <Button color="primary" onClick={() => setMode('light')}>
              Light
            </Button>
            <Button color="primary" onClick={() => setMode('dark')}>
              Dark
            </Button>
            <Button onClick={() => setMode('system')}>System</Button>
          </Buttons>
        </Box>
      </Theme>
    );
  },
};
