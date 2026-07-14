// Skills → Examples → Icons: the bestax-icons skill's canonical example,
// rendered live. Shows the app-root ConfigProvider, meaningful-vs-decorative
// accessibility, sizes/variants/features, and multi-segment IconText.
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExampleMeta } from './ExampleMeta';
import { ConfigProvider, Icon, IconText, Box, Button, Title } from '../index';

const SKILL_HREF =
  'https://github.com/allxsmith/bestax/tree/main/skills/bestax-icons/SKILL.md';

const meta: Meta = {
  title: 'Skills/Icons',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

function Meta_({ prompt }: { prompt: string }) {
  return (
    <ExampleMeta
      skill="bestax-icons"
      skillHref={SKILL_HREF}
      model="Claude Fable 5"
      date="2026-07-14"
      prompt={prompt}
    />
  );
}

export const IconUsage: Story = {
  name: 'Icon usage & accessibility',
  render: function IconUsageExample() {
    return (
      <Box>
        <Meta_ prompt="Add icons to my app: a warning indicator, a starred label, a save button, a loading spinner, and a metro-to-airport route line. Make them accessible." />
        {/* One library for the whole app — 'fa' | 'mdi' | 'ion' |
            'material-icons' | 'material-symbols' (Ionicons is 'ion',
            NOT 'ionicons'). */}
        <ConfigProvider iconLibrary="fa">
          <Title size="5">Meaningful icons carry their own label</Title>
          <Icon
            name="triangle-exclamation"
            textColor="warning"
            ariaLabel="Warning"
          />
          <Icon name="circle-check" textColor="success" ariaLabel="Success" />

          <Title size="5" mt="4">
            Decorative icons hide from screen readers
          </Title>
          <IconText iconProps={{ name: 'star', 'aria-hidden': 'true' }}>
            Starred
          </IconText>
          <Button color="primary" ml="3">
            <Icon name="floppy-disk" aria-hidden="true" />
            <span>Save</span>
          </Button>

          <Title size="5" mt="4">
            Sizes, variants, features, color
          </Title>
          <Icon
            name="rocket"
            size="large"
            features="fa-2x"
            ariaLabel="Launch"
          />
          <Icon name="bell" variant="regular" ariaLabel="Notifications" />
          <Icon name="github" variant="brands" ariaLabel="GitHub" />
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
        </ConfigProvider>
      </Box>
    );
  },
};
