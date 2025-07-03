import type { Meta, StoryObj } from '@storybook/react';
import Footer from './Footer';
import Content from '../elements/Content';

const meta: Meta<typeof Footer> = {
  title: 'Layout/Footer',
  component: Footer,
};
export default meta;

export const Default: StoryObj<typeof Footer> = {
  render: () => (
    <Footer>
      <Content textAlign="centered">
        <p>
          <strong>Bestax</strong> a Bulma component library by{' '}
          <a href="https://bestax.cc">Alex Smith</a>.<br />
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
