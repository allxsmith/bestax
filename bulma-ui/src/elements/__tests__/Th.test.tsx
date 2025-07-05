import { render, screen } from '@testing-library/react';
import { Th, ThProps } from '../Th';

describe('Th Component', () => {
  const defaultProps: ThProps = {
    children: 'Test',
  };

  test('renders th with default props', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toBeInTheDocument();
    expect(th.tagName).toBe('TH');
    expect(th).not.toHaveClass('has-text-left');
    expect(th).not.toHaveClass('has-text-right');
    expect(th).not.toHaveClass('has-text-centered');
    expect(th).toHaveStyle({ width: undefined });
    expect(th).not.toHaveClass('is-primary'); // Explicitly test no color class
  });

  test.each([
    ['left', 'has-text-left'],
    ['right', 'has-text-right'],
    ['centered', 'has-text-centered'],
  ])('applies alignment class for isAligned="%s"', (align, expectedClass) => {
    render(
      <table>
        <thead>
          <tr>
            <Th
              {...defaultProps}
              isAligned={align as 'left' | 'right' | 'centered'}
            />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass(expectedClass);
  });

  test('does not apply alignment class for invalid isAligned', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th
              {...defaultProps}
              isAligned={'invalid' as unknown as ThProps['isAligned']}
            />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).not.toHaveClass('has-text-invalid');
    expect(th).not.toHaveClass('has-text-left');
    expect(th).not.toHaveClass('has-text-right');
    expect(th).not.toHaveClass('has-text-centered');
  });

  test.each([
    ['primary', 'is-primary'],
    ['success', 'is-success'],
    ['danger', 'is-danger'],
    ['white', 'is-white'],
  ])('applies color class for %s', (color, expectedClass) => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} color={color as ThProps['color']} />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass(expectedClass);
  });

  test('does not apply color class when color is undefined', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} color={undefined} />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).not.toHaveClass('is-primary');
    expect(th).not.toHaveClass('is-success');
    expect(th).not.toHaveClass('is-danger');
    expect(th).not.toHaveClass('is-white');
  });

  test('does not apply color class for invalid color', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} color={'invalid' as ThProps['color']} />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).not.toHaveClass('is-invalid');
  });

  test.each([
    [null as unknown, 'null'],
    ['' as unknown, 'empty string'],
  ])(
    'does not apply color class for edge case color=%s',
    (color, _description) => {
      render(
        <table>
          <thead>
            <tr>
              <Th {...defaultProps} color={color as ThProps['color']} />
            </tr>
          </thead>
        </table>
      );
      const th = screen.getByRole('columnheader', { name: 'Test' });
      expect(th).not.toHaveClass(`is-${color}`);
    }
  );

  test('applies color with other props', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th
              {...defaultProps}
              color="primary"
              isAligned="centered"
              m="4"
              className="custom-th"
            />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass('is-primary');
    expect(th).toHaveClass('has-text-centered');
    expect(th).toHaveClass('m-4');
    expect(th).toHaveClass('custom-th');
  });

  test('applies width style as number', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} width={100} />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveStyle({ width: '100px' });
  });

  test('applies width style as string', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} width="10rem" />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveStyle({ width: '10rem' });
  });

  test('does not apply style when width is undefined', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveStyle({ width: undefined });
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} m="4" />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass('m-4');
  });

  test('applies Bulma helper classes (e.g., padding)', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} p="3" />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass('p-3');
  });

  test('applies Bulma helper classes (e.g., textAlign)', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} textAlign="right" />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass('has-text-right');
  });

  test('applies Bulma helper classes (e.g., textWeight)', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} textWeight="bold" />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass('has-text-weight-bold');
  });

  test('applies custom className', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} className="custom-th" />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test' });
    expect(th).toHaveClass('custom-th');
  });

  test('forwards additional HTML attributes', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} id="test-th" aria-label="Test Header" />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader', { name: 'Test Header' });
    expect(th).toHaveAttribute('id', 'test-th');
    expect(th).toHaveAttribute('aria-label', 'Test Header');
  });

  test('renders without children', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole('columnheader');
    expect(th).toBeInTheDocument();
    expect(th).toBeEmptyDOMElement();
  });

  test('renders children content', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
