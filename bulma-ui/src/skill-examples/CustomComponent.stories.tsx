// Skills → Examples → Custom Component: the ProfileCard produced by following
// the bestax-custom-component skill.
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfileCard } from './ProfileCard';
import { ExampleMeta } from './ExampleMeta';
import { Box, Title, SubTitle, Notification } from '../index';

const SKILL_HREF =
  'https://github.com/allxsmith/bestax/tree/main/skills/bestax-custom-component/SKILL.md';

const meta: Meta = {
  title: 'Skills/Custom Component',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const ProfileCardExample: Story = {
  name: 'Custom Component',
  render: () => (
    <Box>
      <ExampleMeta
        skill="bestax-custom-component"
        skillHref={SKILL_HREF}
        model="Claude Opus 4.8"
        date="2026-06-27"
        prompt="Build a ProfileCard component — avatar on top, then name, role, and a short description — following the bestax custom-component skill."
      />

      <Notification color="info" isLight style={{ marginBottom: '1.25rem' }}>
        <strong>Checked the inventory first.</strong> No{' '}
        <code>ProfileCard</code> exists, but <code>Card</code>,{' '}
        <code>Image</code>, <code>Title</code>, <code>SubTitle</code>, and{' '}
        <code>Content</code> do — so the new component <em>composes</em> those
        instead of reinventing them.
      </Notification>

      <Title size="5">
        Result — the generated &lt;ProfileCard /&gt; component
      </Title>
      <SubTitle size="6" textColor="grey">
        forwardRef + useBulmaClasses + usePrefixedClassNames; composes Image /
        Title / SubTitle / Content; styled with the Bulma v1 register-vars /
        getVar SCSS pattern.
      </SubTitle>

      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <ProfileCard
          name="Ada Lovelace"
          role="Mathematician & Writer"
          imageSrc="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/330px-Ada_Lovelace_portrait.jpg"
        >
          English mathematician who worked on Charles Babbage's proposed
          Analytical Engine. She was the first to recognise that the machine had
          applications beyond pure calculation, and published what is now
          regarded as the first algorithm intended to be carried out by a
          machine.
        </ProfileCard>
        <ProfileCard
          name="Alan Turing"
          role="Computer Scientist"
          imageSrc="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/330px-Alan_Turing_Aged_16.jpg"
        >
          British mathematician and logician who formalised the concepts of
          algorithm and computation with the Turing machine. His wartime
          codebreaking at Bletchley Park helped shorten the Second World War,
          and he is widely considered the father of theoretical computer
          science.
        </ProfileCard>
      </div>
    </Box>
  ),
};
