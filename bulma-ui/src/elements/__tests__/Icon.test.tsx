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

  it('renders Ionicons web component when library is ion', () => {
    const { container } = render(<Icon name="home" library="ion" />);
    const ionIcon = container.querySelector('ion-icon');
    expect(ionIcon).toBeInTheDocument();
    expect(ionIcon).toHaveAttribute('name', 'home');
  });

  it('renders Google Material Icons when library is material-icons', () => {
    const { container } = render(<Icon name="home" library="material-icons" />);
    const i = container.querySelector('i');
    expect(i).toBeInTheDocument();
    expect(i).toHaveClass('material-icons');
    expect(i).toHaveTextContent('home');
  });

  it('renders Google Material Icons with style features', () => {
    const { container } = render(
      <Icon
        name="favorite"
        library="material-icons"
        libraryFeatures="outlined"
      />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('material-icons-outlined');
    expect(i).toHaveTextContent('favorite');
  });

  it('renders Material Symbols when library is material-symbols', () => {
    const { container } = render(
      <Icon name="settings" library="material-symbols" />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('material-symbols-outlined');
    expect(i).toHaveTextContent('settings');
  });

  it('renders Material Symbols with style features', () => {
    const { container } = render(
      <Icon name="star" library="material-symbols" libraryFeatures="rounded" />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('material-symbols-rounded');
    expect(i).toHaveTextContent('star');
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

  it('supports array of library features for material-icons', () => {
    const { container } = render(
      <Icon
        name="favorite"
        library="material-icons"
        libraryFeatures={['outlined', 'custom-class']}
      />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('material-icons-outlined', 'custom-class');
    expect(i).toHaveTextContent('favorite');
  });

  it('supports array of library features for material-symbols', () => {
    const { container } = render(
      <Icon
        name="star"
        library="material-symbols"
        libraryFeatures={['sharp', 'extra-class']}
      />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('material-symbols-sharp', 'extra-class');
    expect(i).toHaveTextContent('star');
  });

  it('defaults to material-icons base class when no features provided for material-icons library', () => {
    const { container } = render(<Icon name="home" library="material-icons" />);
    const i = container.querySelector('i');
    expect(i).toHaveClass('material-icons');
    expect(i).toHaveTextContent('home');
  });

  it('defaults to material-symbols-outlined base class when no features provided for material-symbols library', () => {
    const { container } = render(
      <Icon name="settings" library="material-symbols" />
    );
    const i = container.querySelector('i');
    expect(i).toHaveClass('material-symbols-outlined');
    expect(i).toHaveTextContent('settings');
  });

  it('supports all material-icons style variants', () => {
    const styles = ['filled', 'outlined', 'round', 'sharp'];
    const expectedClasses = [
      'material-icons',
      'material-icons-outlined',
      'material-icons-round',
      'material-icons-sharp',
    ];

    styles.forEach((style, index) => {
      const { container } = render(
        <Icon name="home" library="material-icons" variant={style} />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass(expectedClasses[index]);
      expect(i).toHaveTextContent('home');
    });
  });

  it('supports all material-symbols style variants', () => {
    const styles = ['outlined', 'rounded', 'sharp'];
    const expectedClasses = [
      'material-symbols-outlined',
      'material-symbols-rounded',
      'material-symbols-sharp',
    ];

    styles.forEach((style, index) => {
      const { container } = render(
        <Icon name="settings" library="material-symbols" variant={style} />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass(expectedClasses[index]);
      expect(i).toHaveTextContent('settings');
    });
  });

  // New API tests
  describe('New variant and features API', () => {
    it('renders Font Awesome with variant and features', () => {
      const { container } = render(
        <Icon
          name="star"
          library="fa"
          variant="solid"
          features={['fa-lg', 'fa-spin']}
        />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('fas', 'fa-star', 'fa-lg', 'fa-spin');
    });

    it('renders Font Awesome with variant as brands', () => {
      const { container } = render(
        <Icon name="github" library="fa" variant="brands" />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('fab', 'fa-github');
    });

    it('renders Material Icons with variant and features', () => {
      const { container } = render(
        <Icon
          name="star"
          library="material-icons"
          variant="outlined"
          features="is-size-1"
        />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('material-icons-outlined', 'is-size-1');
      expect(i).toHaveTextContent('star');
    });

    it('renders Material Symbols with variant and features', () => {
      const { container } = render(
        <Icon
          name="settings"
          library="material-symbols"
          variant="rounded"
          features={['is-size-1', 'custom-class']}
        />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass(
        'material-symbols-rounded',
        'is-size-1',
        'custom-class'
      );
      expect(i).toHaveTextContent('settings');
    });

    it('renders Ionicons with variant', () => {
      const { container } = render(
        <Icon name="heart" library="ion" variant="outline" />
      );
      const ionIcon = container.querySelector('ion-icon');
      expect(ionIcon).toHaveAttribute('name', 'heart-outline');
    });

    it('renders Ionicons with sharp variant', () => {
      const { container } = render(
        <Icon name="settings" library="ion" variant="sharp" />
      );
      const ionIcon = container.querySelector('ion-icon');
      expect(ionIcon).toHaveAttribute('name', 'settings-sharp');
    });

    it('renders MDI with features only', () => {
      const { container } = render(
        <Icon name="home" library="mdi" features={['is-size-2', 'custom']} />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('mdi', 'mdi-home', 'is-size-2', 'custom');
    });

    it('renders Material Symbols with size features properly', () => {
      const { container } = render(
        <Icon
          name="settings"
          library="material-symbols"
          size="large"
          features="is-size-1"
        />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('material-symbols-outlined', 'is-size-1');
      expect(i).toHaveTextContent('settings');

      const span = container.querySelector('span');
      expect(span).toHaveClass('icon', 'is-large');
    });

    it('handles unknown variant for material-icons with new API', () => {
      const { container } = render(
        <Icon name="home" library="material-icons" variant="unknown-style" />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('material-icons-unknown-style');
      expect(i).toHaveTextContent('home');
    });

    it('handles unknown variant for material-symbols with new API', () => {
      const { container } = render(
        <Icon
          name="settings"
          library="material-symbols"
          variant="unknown-style"
        />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('material-symbols-unknown-style');
      expect(i).toHaveTextContent('settings');
    });
  });

  // Backward compatibility tests
  describe('Backward compatibility with libraryFeatures', () => {
    it('maintains backward compatibility for Font Awesome libraryFeatures', () => {
      const { container } = render(
        <Icon name="star" library="fa" libraryFeatures={['far', 'fa-lg']} />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('far', 'fa-star', 'fa-lg');
    });

    it('maintains backward compatibility for Material Icons libraryFeatures', () => {
      const { container } = render(
        <Icon
          name="home"
          library="material-icons"
          libraryFeatures={['outlined', 'is-size-1']}
        />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('material-icons-outlined', 'is-size-1');
    });

    it('maintains backward compatibility for Material Symbols libraryFeatures', () => {
      const { container } = render(
        <Icon
          name="star"
          library="material-symbols"
          libraryFeatures={['sharp', 'custom']}
        />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('material-symbols-sharp', 'custom');
    });
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

  it('handles unknown style variant for material-icons (fallback case)', () => {
    const { container } = render(
      <Icon
        name="home"
        library="material-icons"
        libraryFeatures="unknown-style"
      />
    );
    const i = container.querySelector('i');
    // Should use the unknown style as the base class (fallback)
    expect(i).toHaveClass('unknown-style');
    expect(i).toHaveTextContent('home');
  });

  it('handles unknown style variant for material-symbols (fallback case)', () => {
    const { container } = render(
      <Icon
        name="settings"
        library="material-symbols"
        libraryFeatures="unknown-style"
      />
    );
    const i = container.querySelector('i');
    // Should use the unknown style as the base class (fallback)
    expect(i).toHaveClass('unknown-style');
    expect(i).toHaveTextContent('settings');
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

  describe('Deprecated icon prop', () => {
    it('parses MDI icon class string to extract name', () => {
      const { container } = render(
        <Icon icon="mdi mdi-rocket-launch" library="mdi" />
      );
      const i = container.querySelector('i');
      expect(i).toHaveClass('mdi', 'mdi-rocket-launch');
    });

    it('parses Font Awesome icon class string to extract name', () => {
      const { container } = render(<Icon icon="fas fa-star" />);
      const i = container.querySelector('i');
      expect(i).toHaveClass('fas', 'fa-star');
    });

    it('parses generic icon class string without prefix', () => {
      const { container } = render(<Icon icon="icon-class some-icon" />);
      const i = container.querySelector('i');
      expect(i).toHaveClass('fas', 'fa-some-icon');
    });
  });
});
