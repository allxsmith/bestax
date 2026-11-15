// Skills → Overview: what the skills are and how to install them. The docs
// site's Skills page lists every skill with its install command, so this
// points there rather than keeping a copy of the list.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Title, SubTitle, Content } from '../index';

const SKILLS_PAGE = 'https://bestax.io/docs/skills/intro';

const meta: Meta = {
  title: 'Skills/Overview',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <Box>
      <Title size="3">Bestax Agent Skills</Title>
      <SubTitle size="5">
        Drop-in skills that teach coding agents to build with bestax-bulma the
        right way.
      </SubTitle>
      <Content>
        <p>
          A skill is a small <code>SKILL.md</code> an agent loads automatically
          when your task matches, plus <code>references/</code> it reads on
          demand. Install one by name with the{' '}
          <a href="https://skills.sh/" target="_blank" rel="noreferrer">
            skills
          </a>{' '}
          CLI, here the form skill:
        </p>
        <pre>
          npx skills add https://github.com/allxsmith/bestax --skill bestax-form
        </pre>
        <p>
          The{' '}
          <a href={SKILLS_PAGE} target="_blank" rel="noreferrer">
            Skills page
          </a>{' '}
          on bestax.io lists every skill, what it does and how to install it.
        </p>
        <p>
          The Custom Component, Form and Icons stories each show their skill in
          use: the prompt, the model, the live result and the generated code.
        </p>
      </Content>
    </Box>
  ),
};
