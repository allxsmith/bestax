import { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Image } from './Image';
import { Block } from './Block';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import logo from '../../images/logo.png';
// The sample pictures are crops of photos published on Unsplash under the
// Unsplash License (https://unsplash.com/license):
// - sample-lioness.jpg: "A close-up portrait of a lioness with amber eyes
//   looking forward", by Samuel Scrimshaw,
//   https://unsplash.com/photos/sseiVD2XsOk
// - sample-fjord-16by9.jpg: "aerial photography of river", Forsand, Norway, by
//   Oleksii Topolianskyi, https://unsplash.com/photos/-oWyJoSqBRM
// - sample-skye-4by3.jpg: "concrete road between mountains", Portree, United
//   Kingdom, by Andrew Ridley, https://unsplash.com/photos/Kt5hRENuotI
import lioness from '../../images/sample-lioness.jpg';
import fjord from '../../images/sample-fjord-16by9.jpg';
import skye from '../../images/sample-skye-4by3.jpg';

const meta: Meta<typeof Image> = {
  title: 'Elements/Image',
  component: Image,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: [
        '16x16',
        '24x24',
        '32x32',
        '48x48',
        '64x64',
        '96x96',
        '128x128',
        'square',
        '1by1',
        '5by4',
        '4by3',
        '3by2',
        '5by3',
        '16by9',
        '2by1',
        '3by1',
        '4by5',
        '3by4',
        '2by3',
        '3by5',
        '9by16',
        '1by2',
        '1by3',
      ],
      description:
        'A fixed size in pixels, or an aspect ratio the image is stretched to fill',
    },
    isRounded: {
      control: 'boolean',
      description: 'Renders the image with fully rounded corners',
    },
    isRetina: {
      control: 'boolean',
      description: 'Offers `src` as the 2x source for high-density screens',
    },
    textColor: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'black-bis',
        'black-ter',
        'grey-darker',
        'grey-dark',
        'grey',
        'grey-light',
        'grey-lighter',
        'white',
        'white-bis',
        'white-ter',
        'light',
        'dark',
        'inherit',
        'current',
      ],
      description: 'Text color helper for the container',
    },
    bgColor: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'black-bis',
        'black-ter',
        'grey-darker',
        'grey-dark',
        'grey',
        'grey-light',
        'grey-lighter',
        'white',
        'white-bis',
        'white-ter',
        'light',
        'dark',
        'inherit',
        'current',
      ],
      description:
        'Background color helper for the container, seen through a transparent image',
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: "Margin on every side, a step of Bulma's spacing scale",
    },
    src: { control: 'text', description: 'Image source URL' },
    alt: { control: 'text', description: 'Alternate text for the image' },
  },
};

export default meta;

type Story = StoryObj<typeof Image>;

// A ratio frame fills the width of its container, so these stories hold it to
// half the canvas from the tablet breakpoint up.
const halfWidth: Decorator = Story => (
  <Columns>
    <Column size="half">
      <Story />
    </Column>
  </Columns>
);

export const Default: Story = {
  args: {
    src: lioness,
    alt: 'A lioness looking straight ahead',
    size: '128x128',
  },
};

export const Rounded: Story = {
  args: {
    src: lioness,
    alt: 'A lioness looking straight ahead',
    size: '128x128',
    isRounded: true,
  },
};

export const Retina: Story = {
  args: {
    src: lioness,
    alt: 'A lioness looking straight ahead',
    size: '128x128',
    isRetina: true,
  },
};

export const AspectRatio16by9: Story = {
  args: {
    src: fjord,
    alt: 'A deep blue fjord between rocky cliffs',
    size: '16by9',
  },
  decorators: [halfWidth],
};

export const AspectRatio4by3: Story = {
  args: {
    src: skye,
    alt: 'A road winding between green hills and cliffs',
    size: '4by3',
  },
  decorators: [halfWidth],
};

export const WithMargin: Story = {
  args: {
    src: lioness,
    alt: 'A lioness looking straight ahead',
    size: '128x128',
    m: '4',
  },
};

// Big Buck Bunny, (c) copyright 2008, Blender Foundation /
// www.bigbuckbunny.org, under CC BY 3.0
// (https://creativecommons.org/licenses/by/3.0/), embedded from Blender's own
// YouTube channel.
export const WithIframe: Story = {
  args: {
    size: '16by9',
    children: (
      <iframe
        className="has-ratio"
        width="640"
        height="360"
        src="https://www.youtube.com/embed/YE7VzlLtp-4"
        frameBorder="0"
        allowFullScreen
        title="Big Buck Bunny"
      />
    ),
  },
  decorators: [halfWidth],
};

export const WithCustomChild: Story = {
  args: {
    size: '4by3',
    children: (
      <Block
        className="has-ratio"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgColor="primary"
        backgroundColorShade="soft"
        textColor="primary"
        colorShade="bold"
      >
        Custom content, held to 4:3
      </Block>
    ),
  },
  decorators: [halfWidth],
};

// The logo is transparent, so the background color shows around it.
export const WithTextColorAndBackground: Story = {
  args: {
    src: logo,
    alt: 'The bestax logo',
    size: '128x128',
    textColor: 'primary',
    bgColor: 'light',
  },
};
