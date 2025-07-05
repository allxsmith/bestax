import type { Meta, StoryObj } from '@storybook/react';
import { Section } from './Section';
import { Title } from '../elements/Title';
import { SubTitle } from '../elements/SubTitle';

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
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
