import { Meta, StoryObj } from '@storybook/react-vite';
import { Message, MessageProps } from './Message';

// Latin version of the Declaration of Independence's first paragraph:
const declarationLatin = `Quando in cursu rerum humanarum fit ut populus aliquis dissolvere vincula politica quae eum cum alio coniunxerunt, et inter potestates terrae, statum separatam et aequalem, ad quem Iura Naturae et Dei Naturalis eum ius habere concedunt, rationabile decus postulat ut causas separationis declarent.`;

const meta: Meta<MessageProps> = {
  title: 'Components/Message',
  component: Message,
};
export default meta;

// ----- STORIES PER COLOR (with header) -----
export const Primary: StoryObj<MessageProps> = {
  args: {
    color: 'primary',
    title: 'Primary',
    children: declarationLatin,
  },
};

export const Link: StoryObj<MessageProps> = {
  args: {
    color: 'link',
    title: 'Link',
    children: declarationLatin,
  },
};

export const Info: StoryObj<MessageProps> = {
  args: {
    color: 'info',
    title: 'Info',
    children: declarationLatin,
  },
};

export const Success: StoryObj<MessageProps> = {
  args: {
    color: 'success',
    title: 'Success',
    children: declarationLatin,
  },
};

export const Warning: StoryObj<MessageProps> = {
  args: {
    color: 'warning',
    title: 'Warning',
    children: declarationLatin,
  },
};

export const Danger: StoryObj<MessageProps> = {
  args: {
    color: 'danger',
    title: 'Danger',
    children: declarationLatin,
  },
};

// ----- STORIES PER COLOR (body only, no header) -----
export const PrimaryBodyOnly: StoryObj<MessageProps> = {
  args: {
    color: 'primary',
    children: declarationLatin,
  },
};

export const LinkBodyOnly: StoryObj<MessageProps> = {
  args: {
    color: 'link',
    children: declarationLatin,
  },
};

export const InfoBodyOnly: StoryObj<MessageProps> = {
  args: {
    color: 'info',
    children: declarationLatin,
  },
};

export const SuccessBodyOnly: StoryObj<MessageProps> = {
  args: {
    color: 'success',
    children: declarationLatin,
  },
};

export const WarningBodyOnly: StoryObj<MessageProps> = {
  args: {
    color: 'warning',
    children: declarationLatin,
  },
};

export const DangerBodyOnly: StoryObj<MessageProps> = {
  args: {
    color: 'danger',
    children: declarationLatin,
  },
};

// ----- STORIES PER SIZE -----
export const DefaultSize: StoryObj<MessageProps> = {
  args: {
    title: 'Default Size',
    children: declarationLatin,
  },
};

export const Small: StoryObj<MessageProps> = {
  args: {
    title: 'Small',
    children: declarationLatin,
  },
};

export const Medium: StoryObj<MessageProps> = {
  args: {
    title: 'Medium',
    children: declarationLatin,
  },
};

export const Large: StoryObj<MessageProps> = {
  args: {
    title: 'Large',
    children: declarationLatin,
  },
};
