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

// ----- COMPOUND COMPONENT STORIES -----
export const CompoundComponents: StoryObj = {
  render: () => (
    <Message color="info">
      <Message.Header>
        <p>Compound Component Message</p>
        <button className="delete" aria-label="delete" />
      </Message.Header>
      <Message.Body>
        <p>
          This message is built using compound components for maximum
          flexibility and control over each section.
        </p>
        <p>{declarationLatin}</p>
      </Message.Body>
    </Message>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the flexible compound component API for Message, allowing fine-grained control over header and body.',
      },
    },
  },
};

export const CompoundMinimal: StoryObj = {
  render: () => (
    <Message color="success">
      <Message.Body>
        <p>A simple message using only the Message.Body compound component.</p>
      </Message.Body>
    </Message>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A minimal example using only the Message.Body compound component.',
      },
    },
  },
};

export const CompoundHeaderOnly: StoryObj = {
  render: () => (
    <Message color="warning">
      <Message.Header>
        <p>Header-only message</p>
        <button className="delete" aria-label="delete" />
      </Message.Header>
    </Message>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example using only the Message.Header compound component.',
      },
    },
  },
};

export const MixedApproach: StoryObj = {
  render: () => (
    <Message color="danger" title="Mixed Approach">
      <Message.Body className="has-background-light">
        <p>You can mix prop-based and compound component approaches!</p>
        <p>
          This message uses the title prop but compound components for the body.
        </p>
      </Message.Body>
    </Message>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows how you can mix the traditional prop-based API with compound components for maximum flexibility.',
      },
    },
  },
};
