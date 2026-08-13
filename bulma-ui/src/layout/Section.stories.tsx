import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section } from './Section';
import { Title } from '../elements/Title';
import { SubTitle } from '../elements/SubTitle';
import { validColors, validSchemeColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
  argTypes: {
    bgColor: {
      control: 'select',
      options: [...validColors, ...validSchemeColors, 'inherit', 'current'],
      description:
        'Background color helper. `scheme-*` values render as a dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead of a class.',
    },
  },
};

export default meta;

export const Default: StoryObj<typeof Section> = {
  render: () => (
    <Section>
      <Title>Section</Title>
      <SubTitle>
        Divide your content into into <strong>sections</strong>. Tada!
      </SubTitle>
    </Section>
  ),
};

export const MediumSection: StoryObj<typeof Section> = {
  render: () => (
    <Section size="medium">
      <Title>Medium Section</Title>
      <SubTitle>
        Divide your content into into <strong>sections</strong>. Tada! Make sure
        your window is wide or you won&apos;t see a medium section.
      </SubTitle>
    </Section>
  ),
};

export const LargeSection: StoryObj<typeof Section> = {
  render: () => (
    <Section size="large">
      <Title>Large Section</Title>
      <SubTitle>
        Divide your content into into <strong>sections</strong>. Tada! Make sure
        your window is wide or you won&apos;t see a large section.
      </SubTitle>
    </Section>
  ),
};

export const AlternatingSchemeBands: StoryObj<typeof Section> = {
  render: () => (
    <>
      <Section>
        <Title>First Band</Title>
        <SubTitle>
          Default background — the page&apos;s own scheme-main surface.
        </SubTitle>
      </Section>
      <Section bgColor="scheme-main-bis">
        <Title>Second Band</Title>
        <SubTitle>
          <code>bgColor=&quot;scheme-main-bis&quot;</code> — a subtle
          dark-mode-adaptive band with zero custom CSS.
        </SubTitle>
      </Section>
      <Section bgColor="scheme-main-ter">
        <Title>Third Band</Title>
        <SubTitle>
          <code>bgColor=&quot;scheme-main-ter&quot;</code> — one step further
          from the page background, still dark-mode safe.
        </SubTitle>
      </Section>
    </>
  ),
};
