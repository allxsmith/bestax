import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Rate } from './Rate';
import { Field } from './Field';

const meta: Meta<typeof Rate> = {
  title: 'Form/Rate',
  component: Rate,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A star/icon-based rating component. Supports custom icons, sizes, and display options for scores and text labels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Controlled value',
    },
    defaultValue: {
      control: 'number',
      description: 'Default value for uncontrolled usage',
    },
    max: {
      control: 'number',
      description: 'Maximum rating value',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the rating icons',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the rating is disabled',
    },
    showScore: {
      control: 'boolean',
      description: 'Show the numeric score',
    },
    showText: {
      control: 'boolean',
      description: 'Show text label for rating',
    },
    spaced: {
      control: 'boolean',
      description: 'Add spacing between icons',
    },
    rtl: {
      control: 'boolean',
      description: 'Right-to-left direction',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Rate>;

/**
 * Basic 5-star rating with default settings.
 */
export const Default: Story = {
  args: {
    defaultValue: 3,
  },
};

/**
 * Controlled rating example.
 */
export const Controlled: Story = {
  render: function ControlledExample() {
    const [rating, setRating] = useState(0);

    return (
      <div>
        <Rate value={rating} onChange={setRating} />
        <p className="mt-2">Selected rating: {rating} / 5</p>
      </div>
    );
  },
};

/**
 * Rating with numeric score display.
 */
export const WithScore: Story = {
  render: function ScoreExample() {
    const [rating, setRating] = useState(4);

    return <Rate value={rating} onChange={setRating} showScore />;
  },
};

/**
 * Rating with text labels.
 */
export const WithText: Story = {
  render: function TextExample() {
    const [rating, setRating] = useState(3);
    const texts = ['Terrible', 'Bad', 'Normal', 'Good', 'Wonderful'];

    return <Rate value={rating} onChange={setRating} showText texts={texts} />;
  },
};

/**
 * Rating with both score and text.
 */
export const WithScoreAndText: Story = {
  render: function ScoreTextExample() {
    const [rating, setRating] = useState(4);
    const texts = ['Poor', 'Fair', 'Average', 'Good', 'Excellent'];

    return (
      <Rate
        value={rating}
        onChange={setRating}
        showScore
        showText
        texts={texts}
      />
    );
  },
};

/**
 * Different sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p className="mb-2">Small</p>
        <Rate defaultValue={3} size="small" />
      </div>
      <div>
        <p className="mb-2">Default</p>
        <Rate defaultValue={3} />
      </div>
      <div>
        <p className="mb-2">Medium</p>
        <Rate defaultValue={3} size="medium" />
      </div>
      <div>
        <p className="mb-2">Large</p>
        <Rate defaultValue={3} size="large" />
      </div>
    </div>
  ),
};

/**
 * Custom maximum rating.
 */
export const CustomMax: Story = {
  render: function CustomMaxExample() {
    const [rating, setRating] = useState(7);

    return (
      <div>
        <p className="mb-2">10-star rating:</p>
        <Rate value={rating} onChange={setRating} max={10} showScore />
      </div>
    );
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    defaultValue: 3,
    disabled: true,
  },
};

/**
 * With spacing between icons.
 */
export const Spaced: Story = {
  args: {
    defaultValue: 4,
    spaced: true,
  },
};

/**
 * Right-to-left layout.
 */
export const RightToLeft: Story = {
  args: {
    defaultValue: 3,
    rtl: true,
  },
};

/**
 * Custom heart icons.
 */
export const CustomHeartIcons: Story = {
  render: function HeartExample() {
    const [rating, setRating] = useState(3);

    const HeartIcon = ({ filled }: { filled: boolean }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    );

    return (
      <div className="rate-hearts">
        <Rate
          value={rating}
          onChange={setRating}
          customIcon={({ isActive }) => <HeartIcon filled={isActive} />}
        />
      </div>
    );
  },
};

/**
 * Custom emoji icons.
 */
export const CustomEmojiIcons: Story = {
  render: function EmojiExample() {
    const [rating, setRating] = useState(3);
    const emojis = ['😢', '😕', '😐', '🙂', '😍'];

    return (
      <Rate
        value={rating}
        onChange={setRating}
        customIcon={({ index, isActive }) => (
          <span
            style={{
              fontSize: '1.5em',
              filter: isActive ? 'none' : 'grayscale(100%)',
              opacity: isActive ? 1 : 0.4,
            }}
          >
            {emojis[index]}
          </span>
        )}
      />
    );
  },
};

/**
 * Product review rating example.
 */
export const ProductReview: Story = {
  render: function ProductReviewExample() {
    const [rating, setRating] = useState(0);

    return (
      <Field>
        <label className="label">Rate this product</label>
        <Rate
          value={rating}
          onChange={setRating}
          size="medium"
          showScore
          showText
          texts={['Poor', 'Fair', 'Average', 'Good', 'Excellent']}
        />
        <p className="help">Click to rate, click again to deselect</p>
      </Field>
    );
  },
};

/**
 * Multiple rating categories.
 */
export const MultipleCategories: Story = {
  render: function MultipleCategoriesExample() {
    const [ratings, setRatings] = useState({
      quality: 4,
      value: 3,
      shipping: 5,
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ width: '80px' }}>Quality:</span>
          <Rate
            value={ratings.quality}
            onChange={v => setRatings({ ...ratings, quality: v })}
            size="small"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ width: '80px' }}>Value:</span>
          <Rate
            value={ratings.value}
            onChange={v => setRatings({ ...ratings, value: v })}
            size="small"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ width: '80px' }}>Shipping:</span>
          <Rate
            value={ratings.shipping}
            onChange={v => setRatings({ ...ratings, shipping: v })}
            size="small"
          />
        </div>
        <p className="mt-2">
          Average:{' '}
          {((ratings.quality + ratings.value + ratings.shipping) / 3).toFixed(
            1
          )}
        </p>
      </div>
    );
  },
};

/**
 * Read-only display rating.
 */
export const ReadOnlyDisplay: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Rate defaultValue={4.5} disabled />
        <span>4.5 out of 5 (128 reviews)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Rate defaultValue={3} disabled size="small" />
        <span className="is-size-7">3.0 out of 5 (42 reviews)</span>
      </div>
    </div>
  ),
};

/**
 * With keyboard navigation (focus to test).
 */
export const KeyboardNavigation: Story = {
  render: function KeyboardExample() {
    const [rating, setRating] = useState(0);

    return (
      <div>
        <p className="mb-2">
          Use arrow keys to change rating, Home/End for min/max:
        </p>
        <Rate value={rating} onChange={setRating} size="medium" showScore />
      </div>
    );
  },
};
