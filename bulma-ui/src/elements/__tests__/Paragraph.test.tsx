import { render, screen } from '@testing-library/react';
import { Paragraph } from '../Paragraph';
import { ConfigProvider } from '../../helpers/Config';

describe('Paragraph Component', () => {
  test('renders children content', () => {
    render(<Paragraph>Test Content</Paragraph>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders as paragraph element', () => {
    render(<Paragraph data-testid="paragraph">Test</Paragraph>);
    const paragraph = screen.getByTestId('paragraph');
    expect(paragraph.tagName).toBe('P');
  });

  test('applies custom className', () => {
    render(<Paragraph className="custom-class">Test</Paragraph>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Paragraph textColor="primary">Test</Paragraph>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Paragraph bgColor="light">Test</Paragraph>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Paragraph m="3" p="4" textAlign="centered" textWeight="bold">
        Test
      </Paragraph>
    );
    const paragraph = screen.getByText('Test');
    expect(paragraph).toHaveClass('m-3', { exact: false });
    expect(paragraph).toHaveClass('p-4', { exact: false });
    expect(paragraph).toHaveClass('has-text-centered', { exact: false });
    expect(paragraph).toHaveClass('has-text-weight-bold', { exact: false });
  });

  test('applies textSize class', () => {
    render(<Paragraph textSize="3">Large Text</Paragraph>);
    expect(screen.getByText('Large Text')).toHaveClass('is-size-3', {
      exact: false,
    });
  });

  test('applies textAlign class', () => {
    render(<Paragraph textAlign="justified">Justified Text</Paragraph>);
    expect(screen.getByText('Justified Text')).toHaveClass(
      'has-text-justified',
      { exact: false }
    );
  });

  test('passes HTML attributes to paragraph', () => {
    render(
      <Paragraph
        id="para-id"
        data-testid="paragraph"
        aria-label="Paragraph"
        title="Paragraph title"
      >
        Test
      </Paragraph>
    );
    const paragraph = screen.getByTestId('paragraph');
    expect(paragraph).toHaveAttribute('id', 'para-id');
    expect(paragraph).toHaveAttribute('aria-label', 'Paragraph');
    expect(paragraph).toHaveAttribute('title', 'Paragraph title');
  });

  test('does not pass non-HTML props to paragraph', () => {
    render(
      <Paragraph
        textColor="primary"
        bgColor="light"
        m="3"
        data-testid="paragraph"
      >
        Test
      </Paragraph>
    );
    const paragraph = screen.getByTestId('paragraph');
    expect(paragraph).not.toHaveAttribute('textColor');
    expect(paragraph).not.toHaveAttribute('bgColor');
    expect(paragraph).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Paragraph data-testid="paragraph">Plain Paragraph</Paragraph>);
    const paragraph = screen.getByTestId('paragraph');
    expect(paragraph.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <Paragraph textColor="primary" bgColor="dark">
        Styled Paragraph
      </Paragraph>
    );
    const paragraph = screen.getByText('Styled Paragraph');
    expect(paragraph).toHaveClass('has-text-primary', { exact: false });
    expect(paragraph).toHaveClass('has-background-dark', { exact: false });
  });

  test('applies margin bottom class', () => {
    render(<Paragraph mb="4">With Margin</Paragraph>);
    expect(screen.getByText('With Margin')).toHaveClass('mb-4', {
      exact: false,
    });
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Paragraph m="2" p="3">
            Test Paragraph
          </Paragraph>
        </ConfigProvider>
      );
      const paragraph = screen.getByText('Test Paragraph');
      expect(paragraph).toHaveClass('bulma-m-2');
      expect(paragraph).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Paragraph m="4" textAlign="centered">
          Standard Paragraph
        </Paragraph>
      );
      const paragraph = screen.getByText('Standard Paragraph');
      expect(paragraph).toHaveClass('m-4');
      expect(paragraph).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Paragraph m="2">Test</Paragraph>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Paragraph p="3">Test</Paragraph>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});
