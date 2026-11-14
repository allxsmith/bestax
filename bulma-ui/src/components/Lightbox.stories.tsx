import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Lightbox, LightboxTrigger, type LightboxItem } from './Lightbox';
import { Button } from '../elements/Button';
import { Image } from '../elements/Image';
import { Paragraph } from '../elements/Paragraph';
import { Span } from '../elements/Span';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { LocaleProvider } from '../helpers/LocaleProvider';

/** A photo from Picsum at a size: the full one for the viewer, small for its thumbnail. */
const photo = (id: number, width: number, height: number) =>
  `https://picsum.photos/id/${id}/${width}/${height}`;

// Picsum serves photos from Unsplash, cropped to the size asked for. Each one
// below is free to use under the Unsplash License
// (https://unsplash.com/license), as its Unsplash page says. The credit beside
// each is the one on that page, which can spell a name differently from
// Picsum's own `/id/<id>/info`.
const PHOTOS: (LightboxItem & { id: number })[] = [
  // Oleksii Topolianskyi, Forsand, Norway:
  // https://unsplash.com/photos/-oWyJoSqBRM
  {
    id: 1015,
    src: photo(1015, 1600, 1067),
    alt: 'A fjord of deep blue water between steep cliffs',
    caption: 'The fjord from the clifftop path',
  },
  // Andrew Ridley, Portree, United Kingdom:
  // https://unsplash.com/photos/Kt5hRENuotI
  {
    id: 1018,
    src: photo(1018, 1600, 1067),
    alt: 'A road winding below a green ridge',
  },
  // Andrew Coelho, Salt Creek Falls, United States:
  // https://unsplash.com/photos/VB-w_3dnyvI
  {
    id: 1039,
    src: photo(1039, 1600, 1067),
    alt: 'A waterfall dropping into a green forest gorge',
    caption: 'The falls after a week of rain',
  },
  // Christian Joudrey, Yosemite National Park, United States:
  // https://unsplash.com/photos/mWRR1xj95hg
  {
    id: 1043,
    src: photo(1043, 1600, 1067),
    alt: 'A river through pines below granite cliffs',
  },
  // Wolfgang Lutz: https://unsplash.com/photos/yOujaSETXlo
  {
    id: 1036,
    src: photo(1036, 1600, 1067),
    alt: 'Snow-covered tents beside a stone wall, below snowy peaks',
    caption: 'Camp on the second night',
  },
  // Joseph Barrientos, Shark Fin Cove, Davenport, California:
  // https://unsplash.com/photos/xcC5ozHk_N8
  {
    id: 1050,
    src: photo(1050, 1600, 1067),
    alt: 'Sea stacks off a cliffed coast',
  },
];

/** A trigger per photo, its thumbnail inside, in a row of columns. */
const thumbnails = (
  <Columns isMultiline isMobile>
    {PHOTOS.map((item, i) => (
      <Column key={item.id} size="one-third">
        <Lightbox.Trigger index={i}>
          <Image
            as="div"
            src={photo(item.id, 480, 320)}
            alt={item.alt}
            size="3by2"
          />
        </Lightbox.Trigger>
      </Column>
    ))}
  </Columns>
);

const meta: Meta<typeof Lightbox> = {
  title: 'Components/Lightbox',
  component: Lightbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Images shown one at a time in a modal viewer, opened from the `Lightbox.Trigger` buttons you place, with previous and next, a counter, captions and zoom. Each move is announced, the arrows and keys follow the reading direction, and focus goes back to the trigger on close.',
      },
    },
  },
  args: {
    items: PHOTOS,
    children: thumbnails,
  },
  argTypes: {
    items: {
      control: false,
      description:
        'The images, in order: each a `src` and an `alt`, with an optional `caption`, `srcSet` and `sizes`',
    },
    children: {
      control: false,
      description:
        'Rendered in place, with no wrapper: usually `Lightbox.Trigger`s in whatever layout you like',
    },
    open: {
      // A control here would hold the viewer open over the canvas, with no
      // way to close it. The Controlled story wires it up.
      control: false,
      description:
        'Whether the viewer is open (controlled). The Controlled story shows it with `onOpenChange`',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Whether the viewer starts open (uncontrolled)',
    },
    onOpenChange: {
      action: 'open changed',
      description:
        'Called when a trigger, the close button, Escape, a click on the background or a swipe down opens or closes it',
    },
    value: {
      // As with `open`: set here, the arrows couldn't move off it.
      control: false,
      description:
        'The index of the image shown (controlled). The Controlled story shows it with `onChange`',
    },
    defaultValue: {
      control: 'number',
      description:
        'The image an uncontrolled viewer shows when something other than a trigger opens it',
    },
    onChange: {
      action: 'image changed',
      description:
        'Called with the new index when a trigger, an arrow, a key or a swipe changes the image',
    },
    repeat: {
      control: 'boolean',
      description:
        'Go from the last image to the first and back, as Carousel does. Off, the previous and next buttons are disabled at the ends',
    },
    zoomable: {
      control: 'boolean',
      description:
        'Zoom with the buttons, the wheel, a double click or tap, pinch and the +, - and 0 keys, and pan a zoomed image',
    },
    maxZoom: {
      control: 'number',
      description: 'How far an image zooms, as a multiple of its fitted size',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Close on Escape, when it’s the topmost overlay',
    },
    closeOnClickOutside: {
      control: 'boolean',
      description: 'Close on a click on the dark background around the image',
    },
    portal: {
      control: 'boolean',
      description:
        'Render the viewer into a portal (true, a selector or an element), or in place with false',
    },
    ariaLabel: {
      control: 'text',
      description:
        'The dialog’s name, the same from image to image; the status line says which image is shown',
    },
    labels: {
      control: 'object',
      description: 'The words it writes, for another language',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the viewer’s `.modal` element',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Lightbox>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', {
      name: 'A waterfall dropping into a green forest gorge',
    });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole('dialog', { name: 'Image viewer' });
    await expect(page.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(dialog).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <Lightbox items={PHOTOS.slice(0, 2)}>
        <Columns isMobile>
          <Column size="half">
            <LightboxTrigger index={0}>
              <Image
                as="div"
                src={photo(PHOTOS[0].id, 480, 320)}
                alt={PHOTOS[0].alt}
                size="3by2"
              />
            </LightboxTrigger>
          </Column>
          <Column size="half">
            <Lightbox.Trigger index={1}>
              <Image
                as="div"
                src={photo(PHOTOS[1].id, 480, 320)}
                alt={PHOTOS[1].alt}
                size="3by2"
              />
            </Lightbox.Trigger>
          </Column>
        </Columns>
      </Lightbox>
    );
  },
};

export const ViewAllPhotos: Story = {
  render: function ViewAllPhotosExample() {
    return (
      <Lightbox items={PHOTOS}>
        <Lightbox.Trigger index={0}>
          <Image as="div" src={photo(1015, 960, 540)} alt="" size="16by9" />
          <Span display="block" mt="2" textWeight="semibold">
            View all {PHOTOS.length} photos
          </Span>
        </Lightbox.Trigger>
      </Lightbox>
    );
  },
};

export const AButtonThatOpensIt: Story = {
  render: function AButtonThatOpensItExample() {
    return (
      <Lightbox items={PHOTOS}>
        <Lightbox.Trigger as={Button} color="link" index={0}>
          Open the album
        </Lightbox.Trigger>
      </Lightbox>
    );
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [shown, setShown] = useState<number>();
    return (
      <>
        <Paragraph mb="3">
          {shown === undefined
            ? 'Closed.'
            : `Showing photo ${shown + 1}, as ?photo=${shown + 1} in the address would.`}
        </Paragraph>
        <Button onClick={() => setShown(3)}>Open at photo 4</Button>
        <Lightbox
          items={PHOTOS}
          open={shown !== undefined}
          onOpenChange={open => !open && setShown(undefined)}
          value={shown ?? 0}
          onChange={setShown}
        />
      </>
    );
  },
};

export const WithoutZoom: Story = {
  args: { zoomable: false },
};

export const DeeperZoom: Story = {
  args: { maxZoom: 6 },
};

/** Numbers as the page writes them, for the progress line. */
const arabic = new Intl.NumberFormat('ar-EG');

export const RightToLeft: Story = {
  args: {
    ariaLabel: 'عارض الصور',
    labels: {
      close: 'إغلاق',
      previous: 'الصورة السابقة',
      next: 'الصورة التالية',
      zoomIn: 'تكبير',
      zoomOut: 'تصغير',
      resetZoom: 'إعادة الحجم',
      loading: 'جارٍ تحميل الصورة',
      loadError: 'تعذّر تحميل هذه الصورة.',
      retry: 'إعادة المحاولة',
      progress: (current, total) =>
        `الصورة ${arabic.format(current)} من ${arabic.format(total)}`,
    },
  },
  render: function RightToLeftExample(args) {
    return (
      <LocaleProvider dir="rtl" locale="ar-EG">
        <Lightbox {...args} />
      </LocaleProvider>
    );
  },
};
