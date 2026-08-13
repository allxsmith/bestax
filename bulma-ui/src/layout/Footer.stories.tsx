import type { Meta, StoryObj } from '@storybook/react-vite';
import Footer from './Footer';
import Content from '../elements/Content';
import { validColors, validSchemeColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof Footer> = {
  title: 'Layout/Footer',
  component: Footer,
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

export const Default: StoryObj<typeof Footer> = {
  render: () => (
    <Footer>
      <Content textAlign="centered">
        <p>
          <strong>Bestax</strong> a Bulma component library by{' '}
          <a href="https://bestax.io">Alex Smith</a>.<br />
          <a href="https://opensource.org/license/mit">
            MIT Source Code License
          </a>
          {', '}
          Web content licensed{' '}
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0//">
            CC BY NC SA 4.0
          </a>
          .
        </p>
      </Content>
    </Footer>
  ),
};

// Dark-mode-adaptive scheme background (inline var() style, no class)
export const SchemeBackground: StoryObj<typeof Footer> = {
  render: () => (
    <Footer bgColor="scheme-main-bis">
      <Content textAlign="centered">
        <p>
          This footer uses <code>bgColor=&quot;scheme-main-bis&quot;</code> — a
          dark-mode-adaptive surface with zero custom CSS.
        </p>
      </Content>
    </Footer>
  ),
};
