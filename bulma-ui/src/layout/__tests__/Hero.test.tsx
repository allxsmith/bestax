import { render } from '@testing-library/react';
import Hero from '../Hero';
import { ConfigProvider } from '../../helpers/Config';

describe('Hero', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Hero>
        <div>Child content</div>
      </Hero>
    );
    expect(getByText('Child content')).toBeInTheDocument();
  });

  it('applies the correct Bulma classes and color', () => {
    const { container } = render(
      <Hero
        color="primary"
        size="large"
        bgColor="dark"
        className="custom-hero"
        data-testid="hero"
      />
    );
    const hero = container.querySelector('.hero');
    expect(hero).toHaveClass('is-primary', 'is-large', 'custom-hero');
  });

  it('applies is-fullheight-with-navbar class via prop', () => {
    const { container } = render(<Hero fullheightWithNavbar />);
    const hero = container.querySelector('.hero');
    expect(hero).toHaveClass('is-fullheight-with-navbar');
  });

  it('applies is-fullheight-with-navbar class via size', () => {
    const { container } = render(<Hero size="fullheight-with-navbar" />);
    const hero = container.querySelector('.hero');
    expect(hero).toHaveClass('is-fullheight-with-navbar');
  });

  it('renders Hero.Head, Hero.Body, and Hero.Foot as children', () => {
    const { getByTestId } = render(
      <Hero>
        <Hero.Head data-testid="head">Head Content</Hero.Head>
        <Hero.Body data-testid="body">Body Content</Hero.Body>
        <Hero.Foot data-testid="foot">Foot Content</Hero.Foot>
      </Hero>
    );
    expect(getByTestId('head')).toHaveClass('hero-head');
    expect(getByTestId('body')).toHaveClass('hero-body');
    expect(getByTestId('foot')).toHaveClass('hero-foot');
  });

  it('applies color, bgColor, and textColor to Hero.Body', () => {
    const { getByTestId } = render(
      <Hero.Body
        data-testid="body"
        color="danger"
        bgColor="black"
        textColor="info"
      >
        Example
      </Hero.Body>
    );
    const body = getByTestId('body');
    // Depending on your useBulmaClasses implementation, check for correct Bulma classes
    expect(body.className).toMatch(/has-text-info/);
    expect(body.className).toMatch(/has-background-black/);
  });

  it('applies color, bgColor, and textColor to Hero.Head and Hero.Foot', () => {
    const { getByTestId } = render(
      <>
        <Hero.Head
          data-testid="head"
          color="success"
          bgColor="white"
          textColor="primary"
        >
          Head
        </Hero.Head>
        <Hero.Foot
          data-testid="foot"
          color="warning"
          bgColor="dark"
          textColor="danger"
        >
          Foot
        </Hero.Foot>
      </>
    );
    const head = getByTestId('head');
    const foot = getByTestId('foot');
    expect(head.className).toMatch(/has-text-primary/);
    expect(head.className).toMatch(/has-background-white/);
    expect(foot.className).toMatch(/has-text-danger/);
    expect(foot.className).toMatch(/has-background-dark/);
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="custom-">
        <Hero data-testid="hero-test">Test Hero</Hero>
      </ConfigProvider>
    );
    const hero = container.querySelector('.custom-hero');
    expect(hero).toBeInTheDocument();
  });

  it('applies classPrefix to Hero subcomponents when provided', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="custom-">
        <Hero>
          <Hero.Head data-testid="head">Head Content</Hero.Head>
          <Hero.Body data-testid="body">Body Content</Hero.Body>
          <Hero.Foot data-testid="foot">Foot Content</Hero.Foot>
        </Hero>
      </ConfigProvider>
    );
    expect(getByTestId('head')).toHaveClass('custom-hero-head');
    expect(getByTestId('body')).toHaveClass('custom-hero-body');
    expect(getByTestId('foot')).toHaveClass('custom-hero-foot');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Hero>Hero content</Hero>
        </ConfigProvider>
      );
      const hero = container.querySelector('.bulma-hero');
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveClass('bulma-hero');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Hero>Hero content</Hero>);
      const hero = container.querySelector('.hero');
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveClass('hero');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Hero>Hero content</Hero>
        </ConfigProvider>
      );
      const hero = container.querySelector('.hero');
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveClass('hero');
    });

    it('applies prefix to both main class and hero modifiers', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Hero color="primary" size="large" fullheightWithNavbar>
            Hero content
          </Hero>
        </ConfigProvider>
      );
      const hero = container.querySelector('.bulma-hero');
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveClass('bulma-hero');
      expect(hero).toHaveClass('bulma-is-primary');
      expect(hero).toHaveClass('bulma-is-large');
      expect(hero).toHaveClass('bulma-is-fullheight-with-navbar');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Hero color="info" size="medium" bgColor="dark">
          Hero content
        </Hero>
      );
      const hero = container.querySelector('.hero');
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveClass('hero');
      expect(hero).toHaveClass('is-info');
      expect(hero).toHaveClass('is-medium');
      expect(hero).toHaveClass('has-background-dark');
    });

    it('applies prefix to Hero subcomponents', () => {
      const { getByTestId } = render(
        <ConfigProvider classPrefix="bulma-">
          <Hero>
            <Hero.Head data-testid="head" textColor="primary">
              Head Content
            </Hero.Head>
            <Hero.Body data-testid="body" bgColor="light">
              Body Content
            </Hero.Body>
            <Hero.Foot data-testid="foot" color="danger">
              Foot Content
            </Hero.Foot>
          </Hero>
        </ConfigProvider>
      );
      expect(getByTestId('head')).toHaveClass('bulma-hero-head');
      expect(getByTestId('head')).toHaveClass('bulma-has-text-primary');
      expect(getByTestId('body')).toHaveClass('bulma-hero-body');
      expect(getByTestId('body')).toHaveClass('bulma-has-background-light');
      expect(getByTestId('foot')).toHaveClass('bulma-hero-foot');
      expect(getByTestId('foot')).toHaveClass('bulma-has-text-danger');
    });
  });
});
