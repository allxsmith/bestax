import { render, screen } from '@testing-library/react';
import { Figure } from '../Figure';
import { ConfigProvider } from '../../helpers/Config';

describe('Figure Component', () => {
  test('renders children content', () => {
    render(
      <Figure>
        <img src="test.jpg" alt="Test" data-testid="image" />
      </Figure>
    );
    expect(screen.getByTestId('image')).toBeInTheDocument();
  });

  test('renders as figure element', () => {
    render(<Figure data-testid="figure" />);
    const figure = screen.getByTestId('figure');
    expect(figure.tagName).toBe('FIGURE');
  });

  test('applies custom className', () => {
    render(<Figure className="custom-class" data-testid="figure" />);
    expect(screen.getByTestId('figure')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Figure textColor="primary" data-testid="figure" />);
    expect(screen.getByTestId('figure')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Figure bgColor="light" data-testid="figure" />);
    expect(screen.getByTestId('figure')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(<Figure m="3" p="4" textAlign="centered" data-testid="figure" />);
    const figure = screen.getByTestId('figure');
    expect(figure).toHaveClass('m-3', { exact: false });
    expect(figure).toHaveClass('p-4', { exact: false });
    expect(figure).toHaveClass('has-text-centered', { exact: false });
  });

  test('passes HTML attributes to figure', () => {
    render(
      <Figure
        id="figure-id"
        data-testid="figure"
        aria-label="Figure"
        title="Figure title"
      />
    );
    const figure = screen.getByTestId('figure');
    expect(figure).toHaveAttribute('id', 'figure-id');
    expect(figure).toHaveAttribute('aria-label', 'Figure');
    expect(figure).toHaveAttribute('title', 'Figure title');
  });

  test('does not pass non-HTML props to figure', () => {
    render(
      <Figure textColor="primary" bgColor="light" m="3" data-testid="figure" />
    );
    const figure = screen.getByTestId('figure');
    expect(figure).not.toHaveAttribute('textColor');
    expect(figure).not.toHaveAttribute('bgColor');
    expect(figure).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Figure data-testid="figure" />);
    const figure = screen.getByTestId('figure');
    expect(figure.getAttribute('class')).toBeNull();
  });

  describe('Figure.Caption', () => {
    test('renders children content', () => {
      render(
        <Figure>
          <Figure.Caption>Caption text</Figure.Caption>
        </Figure>
      );
      expect(screen.getByText('Caption text')).toBeInTheDocument();
    });

    test('renders as figcaption element', () => {
      render(
        <Figure>
          <Figure.Caption data-testid="caption">Caption</Figure.Caption>
        </Figure>
      );
      const caption = screen.getByTestId('caption');
      expect(caption.tagName).toBe('FIGCAPTION');
    });

    test('applies textColor class to caption', () => {
      render(
        <Figure>
          <Figure.Caption textColor="grey">Grey caption</Figure.Caption>
        </Figure>
      );
      expect(screen.getByText('Grey caption')).toHaveClass('has-text-grey', {
        exact: false,
      });
    });

    test('applies bgColor class to caption', () => {
      render(
        <Figure>
          <Figure.Caption bgColor="light">Caption</Figure.Caption>
        </Figure>
      );
      expect(screen.getByText('Caption')).toHaveClass('has-background-light', {
        exact: false,
      });
    });

    test('applies helper classes to caption', () => {
      render(
        <Figure>
          <Figure.Caption mt="2" textSize="7" data-testid="caption">
            Small caption
          </Figure.Caption>
        </Figure>
      );
      const caption = screen.getByTestId('caption');
      expect(caption).toHaveClass('mt-2', { exact: false });
      expect(caption).toHaveClass('is-size-7', { exact: false });
    });

    test('renders without className when no classes are applied', () => {
      render(
        <Figure>
          <Figure.Caption data-testid="caption">Plain caption</Figure.Caption>
        </Figure>
      );
      const caption = screen.getByTestId('caption');
      expect(caption.getAttribute('class')).toBeNull();
    });
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes on figure', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Figure m="2" p="3" data-testid="figure" />
        </ConfigProvider>
      );
      const figure = screen.getByTestId('figure');
      expect(figure).toHaveClass('bulma-m-2');
      expect(figure).toHaveClass('bulma-p-3');
    });

    it('applies prefix to helper classes on caption', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Figure>
            <Figure.Caption mt="2" data-testid="caption">
              Caption
            </Figure.Caption>
          </Figure>
        </ConfigProvider>
      );
      const caption = screen.getByTestId('caption');
      expect(caption).toHaveClass('bulma-mt-2');
    });

    it('works without prefix', () => {
      render(
        <Figure m="4" textAlign="centered" data-testid="figure">
          <Figure.Caption mt="2">Caption</Figure.Caption>
        </Figure>
      );
      const figure = screen.getByTestId('figure');
      expect(figure).toHaveClass('m-4');
      expect(figure).toHaveClass('has-text-centered');
    });
  });
});
