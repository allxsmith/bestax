// Skills → Overview: what the skills are and how to install/use them.
// Mirrors the docs site's /docs/skills/intro page.
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Title, SubTitle, Content } from '../index';

const SKILLS_REPO = 'https://github.com/allxsmith/bestax/tree/main/skills';
const CUSTOM_SKILL_HREF = `${SKILLS_REPO}/bestax-custom-component/SKILL.md`;
const FORM_SKILL_HREF = `${SKILLS_REPO}/bestax-form/SKILL.md`;

const meta: Meta = {
  title: 'Skills/Overview',
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
          demand. Install with the{' '}
          <a href="https://skills.sh/" target="_blank" rel="noreferrer">
            skills
          </a>{' '}
          CLI:
        </p>
        <pre>
          npx skills add https://github.com/allxsmith/bestax --skill
          bestax-custom-component{'\n'}
          npx skills add https://github.com/allxsmith/bestax --skill bestax-form
        </pre>
        <ul>
          <li>
            <a href={CUSTOM_SKILL_HREF} target="_blank" rel="noreferrer">
              <strong>bestax-custom-component</strong>
            </a>{' '}
            — build a new custom Bulma component the bestax way (check for an
            existing one first, then forwardRef + helper hooks + the Bulma v1
            SCSS pattern, stories, tests, docs).
          </li>
          <li>
            <a href={FORM_SKILL_HREF} target="_blank" rel="noreferrer">
              <strong>bestax-form</strong>
            </a>{' '}
            — build forms with the bestax form components and the
            validate-it-yourself error pattern (no form library).
          </li>
        </ul>
        <p>
          The <strong>Examples</strong> stories show each skill actually used —
          the prompt, the model, the live result, and the generated code.
        </p>
      </Content>
    </Box>
  ),
};
