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
});
