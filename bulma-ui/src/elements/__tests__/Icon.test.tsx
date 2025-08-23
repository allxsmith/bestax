import { render } from '@testing-library/react';
import { Icon } from '../Icon';
import { ConfigProvider } from '../../helpers/Config';

describe('Icon', () => {
  it('renders a Font Awesome icon by default', () => {
    const { container } = render(<Icon name="star" />);
    const i = container.querySelector('i');
    expect(i).toBeInTheDocument();
    expect(i).toHaveClass('fas', 'fa-star');
  });

  it('respects Font Awesome libraryFeatures', () => {
    const { container } = render(
      <Icon name="star" libraryFeatures={['fas', 'fa-lg', 'fa-fw']} />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('fas', 'fa-star', 'fa-lg', 'fa-fw');
  });

  it('renders Material Design Icons when library is mdi', () => {
    const { container } = render(<Icon name="account" library="mdi" />);
    const i = container.querySelector('i');
    expect(i).toHaveClass('mdi', 'mdi-account');
  });

  it('renders Ionicons when library is ion', () => {
    const { container } = render(<Icon name="person" library="ion" />);
    const i = container.querySelector('i');
    expect(i).toHaveClass('ion', 'ion-person');
  });

  it('renders aria-label and passes style to span', () => {
    const { container } = render(
      <Icon name="star" ariaLabel="star icon" style={{ color: 'red' }} />
    );
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('aria-label', 'star icon');
    expect(span).toHaveStyle({ color: 'red' });
  });

  it('applies Bulma size modifier', () => {
    const { container } = render(<Icon name="star" size="large" />);
    const span = container.querySelector('span.icon');
    expect(span).toHaveClass('is-large');
  });

  it('applies custom className and Bulma helpers', () => {
    const { container } = render(
      <Icon name="star" className="my-custom-class" m="2" textColor="primary" />
    );
    const span = container.querySelector('span.icon');
    expect(span).toHaveClass('my-custom-class');
    // m="2" and textColor="primary" should result in Bulma classes
    expect(span?.className).toMatch(/has-text-primary/);
    expect(span?.className).toMatch(/m-2/);
  });

  it('defaults to "fas" style when no Font Awesome style is provided', () => {
    const { container } = render(
      <Icon name="star" library="fa" libraryFeatures={['fa-lg']} />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('fas', 'fa-star', 'fa-lg');
  });

  it('supports single string as libraryFeatures', () => {
    const { container } = render(<Icon name="star" libraryFeatures="fa-lg" />);
    const i = container.querySelector('i');
    expect(i).toHaveClass('fas', 'fa-star', 'fa-lg');
  });

  it('renders fallback icon class for unknown library', () => {
    const { container } = render(
      <Icon
        name="star"
        // @ts-expect-error Testing unknown library value
        library="unknown"
        libraryFeatures={['weird', 'iconic']}
      />
    );
    const i = container.querySelector('i');
    // The default case just joins name + features
    expect(i).toHaveClass('star', 'weird', 'iconic');
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      const { container } = render(
        <ConfigProvider classPrefix="my-prefix-">
          <Icon name="star" />
        </ConfigProvider>
      );
      const span = container.querySelector('span');
      expect(span).toHaveClass('my-prefix-icon');
    });

    it('uses default class when no classPrefix provided', () => {
      const { container } = render(
        <ConfigProvider>
          <Icon name="star" />
        </ConfigProvider>
      );
      const span = container.querySelector('span');
      expect(span).toHaveClass('icon');
    });

    it('uses default class when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Icon name="star" />
        </ConfigProvider>
      );
      const span = container.querySelector('span');
      expect(span).toHaveClass('icon');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Icon name="star" size="large" m="2" />
        </ConfigProvider>
      );

      const span = container.querySelector('span');
      expect(span).toHaveClass('bulma-icon');
      expect(span).toHaveClass('bulma-is-large');
      expect(span).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(<Icon name="heart" size="medium" p="3" />);

      const span = container.querySelector('span');
      expect(span).toHaveClass('icon');
      expect(span).toHaveClass('is-medium');
      expect(span).toHaveClass('p-3');
    });
  });
});
