import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useClipboard } from './useClipboard';
import { Code } from '../elements/Code';
import { LinkButton } from '../elements/LinkButton';
import { Span } from '../elements/Span';

interface CommitIdProps {
  /** The full commit hash it copies. */
  sha?: string;
  /** How long `copied` stays true, in milliseconds. */
  duration?: number;
}

/**
 * A trigger of your own: the short hash as a link-styled button that copies
 * the full one. It announces "Copied" itself, through a status region that's
 * in the page before the click.
 */
const CommitId = ({
  sha = '4a1986aa2c7f3e1b9d05e6a8f2c4b7d1e3f5a9c8',
  duration = 1500,
}: CommitIdProps) => {
  const short = sha.slice(0, 7);
  // A new element for each message, so a repeat is announced too.
  const [said, setSaid] = useState({ id: 0, text: '' });
  const { copy, copied, error } = useClipboard({
    duration,
    onCopiedChange: done =>
      setSaid(s => ({
        id: s.id + 1,
        text: done ? `Copied commit ${short}` : '',
      })),
  });

  return (
    <>
      <LinkButton
        type="button"
        aria-label={`Copy commit ${short}`}
        onClick={() => copy(sha)}
      >
        <Code>{short}</Code>
      </LinkButton>
      <Span role="status" visibility="sr-only">
        <span key={said.id}>{said.text}</span>
      </Span>
      <Span ml="2" textColor={error ? 'danger' : 'grey'} aria-hidden="true">
        {copied ? 'Copied' : error ? "Couldn't copy" : ''}
      </Span>
    </>
  );
};

const meta: Meta<typeof CommitId> = {
  title: 'Helpers/useClipboard',
  component: CommitId,
  parameters: {
    docs: {
      description: {
        component:
          'Copies text to the clipboard through the Clipboard API, falling back to the copy command where that is missing or refused, and keeps a copied flag for a moment after. It announces nothing, so a trigger of your own says "Copied" in a status region that is in the page before the click. Click the hash to copy the full commit id.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sha: {
      control: 'text',
      description: 'The full commit hash the button copies',
    },
    duration: {
      control: { type: 'number', min: 0, step: 500 },
      description:
        'Passed as `duration`: how long `copied` stays true, in ms; 0 keeps it until a later copy fails',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommitId>;

export const Default: Story = {
  args: { duration: 1500 },
};
