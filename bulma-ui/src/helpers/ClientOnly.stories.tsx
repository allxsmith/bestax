import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClientOnly } from './ClientOnly';
import { Notification } from '../elements/Notification';
import { Skeleton } from '../elements/Skeleton';

const meta: Meta<typeof ClientOnly> = {
  title: 'Helpers/ClientOnly',
  component: ClientOnly,
  parameters: {
    docs: {
      description: {
        component:
          'Renders its children only in the browser, after hydration, and a `fallback` until then. Storybook renders on the client, so the children show straight away here; under server rendering the fallback is what the server sends.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: false,
      description:
        'Content to render once hydrated. A function is called only then, so browser-only expressions inside it never run on the server.',
    },
    fallback: {
      control: false,
      description:
        'Rendered on the server and during hydration instead of the children.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ClientOnly>;

/**
 * The reader's time zone only exists in the browser. The function child keeps
 * `Intl.DateTimeFormat()` off the server, and the skeleton holds its place
 * until hydration.
 */
export const Default: Story = {
  render: () => (
    <ClientOnly fallback={<Skeleton variant="lines" lines={1} />}>
      {() => (
        <Notification color="info">
          Times are shown in{' '}
          <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong>.
        </Notification>
      )}
    </ClientOnly>
  ),
};
