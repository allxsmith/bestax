import { render, screen, fireEvent } from '@testing-library/react';
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
    const onDelete = jest.fn();
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
});
