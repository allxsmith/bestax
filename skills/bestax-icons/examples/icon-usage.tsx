// Icons with @allxsmith/bestax-bulma — the canonical patterns.
//
// The app must load the icon library itself (bestax ships no icon fonts):
// here Font Awesome, via `npm install @fortawesome/fontawesome-free` and
// `import '@fortawesome/fontawesome-free/css/all.min.css';` in main.tsx.
// Set the library ONCE on ConfigProvider ('fa' | 'mdi' | 'ion' |
// 'material-icons' | 'material-symbols' — Ionicons is 'ion', NOT 'ionicons');
// every <Icon> below then omits `library`.
import React from 'react';
import {
  ConfigProvider,
  Icon,
  IconText,
  Button,
  Box,
  Title,
} from '@allxsmith/bestax-bulma';

export function IconShowcase() {
  return (
    <ConfigProvider iconLibrary="fa">
      <Box>
        <Title size="5">Meaningful icons carry their own label</Title>
        {/* Standalone icons convey information — give them a descriptive
            ariaLabel (the default is just "icon"). */}
        <Icon
          name="triangle-exclamation"
          textColor="warning"
          ariaLabel="Warning"
        />
        <Icon name="circle-check" textColor="success" ariaLabel="Success" />

        <Title size="5" mt="4">
          Decorative icons hide from screen readers
        </Title>
        {/* Next to visible text the icon repeats the message — aria-hidden
            stops "icon" (or a duplicate) being announced. */}
        <IconText iconProps={{ name: 'star', 'aria-hidden': 'true' }}>
          Starred
        </IconText>
        <Button color="primary">
          <Icon name="floppy-disk" aria-hidden="true" />
          <span>Save</span>
        </Button>

        <Title size="5" mt="4">
          Sizes, variants, features, color
        </Title>
        {/* `size` sizes the Bulma container; `features` scales the glyph. */}
        <Icon name="rocket" size="large" features="fa-2x" ariaLabel="Launch" />
        {/* Font Awesome styles come from `variant`; brands require it. */}
        <Icon name="bell" variant="regular" ariaLabel="Notifications" />
        <Icon name="github" variant="brands" ariaLabel="GitHub" />
        {/* Spin + color via features and the textColor helper. */}
        <Icon
          name="spinner"
          features="fa-spin"
          textColor="info"
          ariaLabel="Loading"
        />

        <Title size="5" mt="4">
          Multi-segment icon text
        </Title>
        <IconText
          items={[
            {
              iconProps: { name: 'train', 'aria-hidden': 'true' },
              text: 'Metro',
            },
            {
              iconProps: { name: 'arrow-right', 'aria-hidden': 'true' },
              text: 'Airport',
            },
          ]}
        />
      </Box>
    </ConfigProvider>
  );
}
