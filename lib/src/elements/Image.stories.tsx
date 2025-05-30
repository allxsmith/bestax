import { Meta, StoryObj } from '@storybook/react';
import { Image } from './Image';

const meta: Meta<typeof Image> = {
  title: 'Components/Image',
  component: Image,
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
    },
    isRounded: { control: 'boolean' },
    isRetina: { control: 'boolean' },
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
        'light',
        'dark',
        'inherit',
        'current',
      ],
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
        'light',
        'dark',
        'inherit',
        'current',
      ],
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    src: { control: 'text' },
    alt: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Image>;

const sampleImage =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png';

export const Default: Story = {
  args: {
    src: sampleImage,
    alt: 'Sample image',
    size: '128x128',
  },
};

export const Rounded: Story = {
  args: {
    src: sampleImage,
    alt: 'Rounded image',
    size: '128x128',
    isRounded: true,
  },
};

export const Retina: Story = {
  args: {
    src: sampleImage,
    alt: 'Retina image',
    size: '128x128',
    isRetina: true,
  },
};

export const AspectRatio16by9: Story = {
  args: {
    src: sampleImage,
    alt: '16:9 aspect ratio image',
    size: '16by9',
  },
};

export const AspectRatio4by3: Story = {
  args: {
    src: sampleImage,
    alt: '4:3 aspect ratio image',
    size: '4by3',
  },
};

export const WithMargin: Story = {
  args: {
    src: sampleImage,
    alt: 'Image with margin',
    size: '128x128',
    m: '4',
  },
};

export const WithIframe: Story = {
  args: {
    size: '16by9',
    children: (
      <iframe
        className="has-ratio"
        width="640"
        height="360"
        src="https://www.youtube.com/watch?v=XxVg_s8xAms"
        frameBorder="0"
        allowFullScreen
        title="Sample YouTube Video"
      />
    ),
  },
};

export const WithCustomChild: Story = {
  args: {
    size: '4by3',
    children: (
      <div
        className="has-ratio has-background-grey-light has-text-centered"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Custom Content</p>
      </div>
    ),
  },
};

export const WithTextColorAndBackground: Story = {
  args: {
    src: sampleImage,
    alt: 'Image with text and background color',
    size: '128x128',
    textColor: 'primary',
    bgColor: 'light',
  },
};
