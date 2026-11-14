// Skills → Examples → Custom Component: the ProfileCard produced by following
// the bestax-custom-component skill.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfileCard } from './ProfileCard';
import { ExampleMeta } from './ExampleMeta';
import { Box, Group, Title, SubTitle, Notification } from '../index';
// Both portraits are in the public domain, per their Wikimedia Commons pages:
// - portrait-ada-lovelace.jpg: Ada Lovelace, watercolor, about 1840, possibly
//   by Alfred Edward Chalon (died 1860), Science Museum, London.
//   https://commons.wikimedia.org/wiki/File:Ada_Lovelace_portrait.jpg
// - portrait-alan-turing.jpg: passport photo of Alan Turing at 16, 1928 to
//   1929, possibly by Arthur Reginald Chaffin (died 1954), published before
//   1931. https://commons.wikimedia.org/wiki/File:Alan_Turing_Aged_16.jpg
import adaLovelace from '../../images/portrait-ada-lovelace.jpg';
import alanTuring from '../../images/portrait-alan-turing.jpg';

const SKILL_HREF =
  'https://github.com/allxsmith/bestax/tree/main/skills/bestax-custom-component/SKILL.md';

const meta: Meta = {
  title: 'Skills/Custom Component',
  tags: ['autodocs'],
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

      <Notification color="info" isLight>
        <strong>Checked the inventory first.</strong> No{' '}
        <code>ProfileCard</code> exists, but <code>Card</code>,{' '}
        <code>Image</code>, <code>Title</code>, <code>SubTitle</code>, and{' '}
        <code>Content</code> do, so the new component <em>composes</em> those
        instead of reinventing them.
      </Notification>

      <Title size="5">
        Result: the generated &lt;ProfileCard /&gt; component
      </Title>
      <SubTitle size="6" textColor="grey">
        forwardRef + useBulmaClasses + usePrefixedClassNames; composes Image /
        Title / SubTitle / Content; styled with the Bulma v1 register-vars /
        getVar SCSS pattern.
      </SubTitle>

      {/* Stretched, so the cards in a row end at the same height. */}
      <Group alignItems="stretch" gap="2.5">
        <ProfileCard
          name="Ada Lovelace"
          role="Mathematician & Writer"
          imageSrc={adaLovelace}
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
          imageSrc={alanTuring}
        >
          British mathematician and logician who formalised the concepts of
          algorithm and computation with the Turing machine. His wartime
          codebreaking at Bletchley Park helped shorten the Second World War,
          and he is widely considered the father of theoretical computer
          science.
        </ProfileCard>
      </Group>
    </Box>
  ),
};
