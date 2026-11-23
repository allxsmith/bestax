import type { Meta, StoryObj } from '@storybook/react-vite';
import Footer from './Footer';
import Content from '../elements/Content';
import { Link } from '../elements/Link';
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
          <Link href="https://bestax.io" textTransform="underlined">
            Alex Smith
          </Link>
          .<br />
          <Link
            href="https://opensource.org/license/mit"
            textTransform="underlined"
          >
            MIT Source Code License
          </Link>
          {', '}
          Web content licensed{' '}
          <Link
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            textTransform="underlined"
          >
            CC BY NC SA 4.0
          </Link>
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
