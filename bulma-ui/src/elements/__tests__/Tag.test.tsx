import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag, TagProps } from '../Tag';
import { ConfigProvider } from '../../helpers/Config';

describe('Tag Component', () => {
  const defaultProps: TagProps = {
    children: 'Test Tag',
  };

  test('renders tag with default props', () => {
    render(<Tag {...defaultProps} />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toBeInTheDocument();
    expect(tag.tagName).toBe('SPAN');
    expect(tag).toHaveClass('tag');
  });

  test('applies color class', () => {
    render(<Tag {...defaultProps} color="primary" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-primary');
  });

  test('does not apply invalid color class', () => {
    render(<Tag {...defaultProps} color={undefined} />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag');
    expect(tag).not.toHaveClass('is-undefined');
  });

  test('applies size class', () => {
    render(<Tag {...defaultProps} size="medium" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-medium');
  });

  test('does not apply normal size class', () => {
    render(<Tag {...defaultProps} size="normal" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag');
    expect(tag).not.toHaveClass('is-normal');
  });

  test('applies rounded class', () => {
    render(<Tag {...defaultProps} isRounded />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-rounded');
  });

  test('applies is-light class via isLight', () => {
    render(<Tag {...defaultProps} color="primary" isLight />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-primary is-light');
  });

  // The light color's class is the same key as isLight's (#1464).
  test('applies is-light for color="light"', () => {
    render(<Tag {...defaultProps} color="light" />);
    expect(screen.getByText('Test Tag')).toHaveClass('tag is-light');
  });

  test('applies is-light once for color="light" with isLight', () => {
    render(<Tag {...defaultProps} color="light" isLight />);
    expect(screen.getByText('Test Tag').className).toBe('tag is-light');
  });

  test('applies is-light for color="light" on the delete-button render path', () => {
    render(<Tag {...defaultProps} isDelete color="light" />);
    expect(screen.getByRole('button', { name: 'Delete tag' })).toHaveClass(
      'tag is-delete is-light'
    );
  });

  test('does not apply is-light by default', () => {
    render(<Tag {...defaultProps} color="primary" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).not.toHaveClass('is-light');
  });

  test('applies is-light on the delete-button render path', () => {
    render(<Tag {...defaultProps} isDelete isLight />);
    const button = screen.getByRole('button', { name: 'Delete tag' });
    expect(button).toHaveClass('tag is-delete is-light');
  });

  test('applies the class prefix to is-light', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Tag color="primary" isLight>
          Prefixed Tag
        </Tag>
      </ConfigProvider>
    );
    const tag = screen.getByText('Prefixed Tag');
    expect(tag).toHaveClass('bestax-tag');
    expect(tag).toHaveClass('bestax-is-light');
  });

  test('applies hoverable class', () => {
    render(<Tag {...defaultProps} isHoverable />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-hoverable');
  });

  test('renders as delete button', () => {
    render(<Tag {...defaultProps} isDelete />);
    const button = screen.getByRole('button', { name: 'Delete tag' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveClass('tag is-delete');
    expect(button).toBeEmptyDOMElement();
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<Tag {...defaultProps} isDelete onDelete={onDelete} />);
    const button = screen.getByRole('button', { name: 'Delete tag' });
    fireEvent.click(button);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('renders the delete button with type="button", so it does not submit a form around it', () => {
    render(<Tag isDelete />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  test('keeps the delete button type and name through a spread carrying absent values', () => {
    // React reads an `undefined` attribute as "remove it", and a props spread
    // whose key has no value is how that arrives. The name default was
    // written before the spread and erased by it.
    const spread: object = { type: undefined, 'aria-label': undefined };
    render(<Tag isDelete data-testid="del" {...spread} />);
    const button = screen.getByTestId('del');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-label', 'Delete tag');
  });

  test('falls back to the delete button name when given an empty aria-label', () => {
    // `''` names nothing, and the button is drawn as a cross, so an empty
    // label would leave it unnamed. It falls back like a missing one.
    render(<Tag isDelete data-testid="del" aria-label="" />);
    expect(screen.getByTestId('del')).toHaveAttribute(
      'aria-label',
      'Delete tag'
    );
  });

  test('lets an explicit aria-label, or a submit or reset type, win on the delete button', () => {
    // `type` is not in Tag's own props, so a caller's value arrives through a
    // spread; the defaults must not override a real one.
    const submit: object = { type: 'submit' };
    const reset: object = { type: 'reset' };
    render(
      <>
        <Tag isDelete data-testid="named" aria-label="Remove filter" />
        <Tag isDelete data-testid="submit" {...submit} />
        <Tag isDelete data-testid="reset" {...reset} />
      </>
    );
    expect(screen.getByTestId('named')).toHaveAttribute(
      'aria-label',
      'Remove filter'
    );
    expect(screen.getByTestId('submit')).toHaveAttribute('type', 'submit');
    expect(screen.getByTestId('reset')).toHaveAttribute('type', 'reset');
  });

  test('replaces a delete button type HTML would read as submit with type="button"', () => {
    const loose: object = { type: 'text/html' };
    render(<Tag isDelete {...loose} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Tag {...defaultProps} m="4" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag m-4');
  });

  test('applies custom className', () => {
    render(<Tag {...defaultProps} className="custom-tag" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag custom-tag');
  });

  test('forwards additional HTML attributes', () => {
    render(<Tag {...defaultProps} data-testid="custom-tag" />);
    const tag = screen.getByTestId('custom-tag');
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveClass('tag');
  });

  test('renders without children', () => {
    render(<Tag data-testid="empty-tag" />);
    const tag = screen.getByTestId('empty-tag');
    expect(tag).toBeInTheDocument();
    expect(tag.tagName).toBe('SPAN');
    expect(tag).toHaveClass('tag');
    expect(tag).toBeEmptyDOMElement();
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Tag>Test</Tag>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('my-prefix-tag');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Tag>Test</Tag>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('tag');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Tag>Test</Tag>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('tag');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Tag color="primary" size="large" isRounded m="2">
            Test Tag
          </Tag>
        </ConfigProvider>
      );

      const tag = screen.getByText('Test Tag');
      expect(tag).toHaveClass('bulma-tag');
      expect(tag).toHaveClass('bulma-is-primary');
      expect(tag).toHaveClass('bulma-is-large');
      expect(tag).toHaveClass('bulma-is-rounded');
      expect(tag).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Tag color="info" size="medium" p="3">
          Standard Tag
        </Tag>
      );

      const tag = screen.getByText('Standard Tag');
      expect(tag).toHaveClass('tag');
      expect(tag).toHaveClass('is-info');
      expect(tag).toHaveClass('is-medium');
      expect(tag).toHaveClass('p-3');
    });
  });

  // A tag that does something renders the link or button Bulma styles, so a
  // keyboard reaches it and a screen reader announces it as one (#1841).
  describe('as', () => {
    test('renders a link a keyboard reaches', async () => {
      const user = userEvent.setup();
      render(
        <Tag as="a" href="#topic" target="_blank" color="info">
          Topic
        </Tag>
      );
      const link = screen.getByRole('link', { name: 'Topic' });
      expect(link).toHaveClass('tag', 'is-info');
      expect(link).toHaveAttribute('href', '#topic');
      expect(link).toHaveAttribute('target', '_blank');
      await user.tab();
      expect(link).toHaveFocus();
    });

    test('renders a button a keyboard reaches and presses', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Tag as="button" onClick={onClick} isHoverable>
          Filter
        </Tag>
      );
      const button = screen.getByRole('button', { name: 'Filter' });
      expect(button).toHaveClass('tag', 'is-hoverable');
      expect(button).toHaveAttribute('type', 'button');
      await user.tab();
      expect(button).toHaveFocus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    test("keeps a button's submit or reset type", () => {
      const submit = { type: 'submit' };
      render(
        <Tag as="button" {...submit}>
          Apply
        </Tag>
      );
      expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute(
        'type',
        'submit'
      );
    });

    test('gives a link and a button only the attributes each takes', () => {
      const attrs = {
        href: '#x',
        rel: 'noopener',
        download: 'file',
        disabled: true,
        name: 'n',
        value: 'v',
      };
      render(
        <>
          <Tag {...attrs}>Span</Tag>
          <Tag as="a" {...attrs}>
            Link
          </Tag>
          <Tag as="button" {...attrs}>
            Button
          </Tag>
        </>
      );
      // A span tag passes on what it's given, as it always has.
      expect(screen.getByText('Span')).toHaveAttribute('href', '#x');
      const link = screen.getByText('Link');
      expect(link).toHaveAttribute('href', '#x');
      expect(link).toHaveAttribute('rel', 'noopener');
      expect(link).not.toHaveAttribute('disabled');
      expect(link).not.toHaveAttribute('name');
      const button = screen.getByText('Button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('name', 'n');
      expect(button).not.toHaveAttribute('href');
      expect(button).not.toHaveAttribute('rel');
    });

    test('renders the delete button with isDelete, whatever as says', () => {
      render(<Tag as="a" href="#x" isDelete />);
      expect(
        screen.getByRole('button', { name: 'Delete tag' })
      ).not.toHaveAttribute('href');
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('carries the class prefix on a link or a button', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Tag as="a" href="#x">
            Link
          </Tag>
          <Tag as="button">Button</Tag>
        </ConfigProvider>
      );
      expect(screen.getByRole('link')).toHaveClass('bulma-tag');
      expect(screen.getByRole('button')).toHaveClass('bulma-tag');
    });
  });
});
