import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from '../Avatar';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    render(<Avatar src="/photo.jpg" alt="Ada Lovelace" name="Ada Lovelace" />);
    const img = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', '/photo.jpg');
  });

  it('renders an image with an empty alt when neither alt nor name is provided', () => {
    const { container } = render(<Avatar src="/photo.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('falls back to the icon when a whitespace-only name yields no initials', () => {
    render(<Avatar name="   " icon={<span data-testid="fallback-icon" />} />);
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    render(<Avatar src="/broken.jpg" name="Ada Lovelace" />);
    const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('resets the error state when src changes', () => {
    const { rerender } = render(
      <Avatar src="/broken.jpg" name="Ada Lovelace" />
    );
    const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('AL')).toBeInTheDocument();

    rerender(<Avatar src="/fixed.jpg" name="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
      'src',
      '/fixed.jpg'
    );
  });

  it('retries a previously failed src after switching away and back', () => {
    const { rerender } = render(
      <Avatar src="/broken.jpg" name="Ada Lovelace" />
    );
    const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('AL')).toBeInTheDocument();

    rerender(<Avatar src="/fixed.jpg" name="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
      'src',
      '/fixed.jpg'
    );

    // Switching back to the once-failed src must remount the img and retry it,
    // not permanently latch onto the old failure.
    rerender(<Avatar src="/broken.jpg" name="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
      'src',
      '/broken.jpg'
    );
  });

  it('remounts the img node when src changes', () => {
    const { rerender } = render(<Avatar src="/a.jpg" name="Ada Lovelace" />);
    const first = screen.getByRole('img', { name: 'Ada Lovelace' });
    rerender(<Avatar src="/b.jpg" name="Ada Lovelace" />);
    const second = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(second).toHaveAttribute('src', '/b.jpg');
    // A fresh DOM node (via key={src}) means a late error event from the old
    // request cannot fire on a retained node and latch the new src as failed.
    expect(second).not.toBe(first);
  });

  it('respects an explicit empty alt as decorative on the image', () => {
    const { container } = render(
      <Avatar src="/photo.jpg" alt="" name="Ada Lovelace" />
    );
    // alt="" must not be overridden by name — the img stays decorative.
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('hides a decorative non-image avatar from screen readers', () => {
    render(<Avatar alt="" name="Ada Lovelace" data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).not.toHaveAttribute('role');
    expect(avatar).not.toHaveAttribute('aria-label');
    // Still visible to sighted users.
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('gives a nameless interactive image avatar an aria-label fallback', () => {
    render(<Avatar src="/photo.jpg" href="https://example.com" />);
    expect(screen.getByRole('link', { name: 'Avatar' })).toBeInTheDocument();
  });

  it('names an interactive image avatar from name when alt is explicitly empty', () => {
    render(
      <Avatar
        src="/photo.jpg"
        alt=""
        name="Ada Lovelace"
        href="https://example.com"
      />
    );
    // A link must have a name, so the decorative opt-out yields to name.
    expect(
      screen.getByRole('link', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
  });

  it('keeps a custom link-like avatar interactive when alt is explicitly empty', () => {
    const CustomLink: React.FC<{
      href?: string;
      children?: React.ReactNode;
    }> = ({ href, children, ...rest }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    );
    render(
      <Avatar
        as={CustomLink}
        href="https://example.com"
        alt=""
        name="Ada Lovelace"
      />
    );
    // A custom `as` component with href is a link (the same condition that
    // forwards href to it) — the decorative opt-out must not aria-hide it,
    // and it keeps an accessible name.
    expect(
      screen.getByRole('link', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
  });

  it('names an interactive non-image avatar from name when alt is explicitly empty', () => {
    render(<Avatar alt="" name="Ada Lovelace" as="button" />);
    expect(
      screen.getByRole('button', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
  });

  it('defaults an as="button" avatar to type="button"', () => {
    render(<Avatar name="Ada Lovelace" as="button" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('derives initials from a single-word name', () => {
    render(<Avatar name="Cher" />);
    expect(screen.getByText('CH')).toBeInTheDocument();
  });

  it('derives initials by code point for astral-plane names', () => {
    render(<Avatar name="😀🎉" />);
    // Array.from keeps whole code points, so no half-surrogate initials.
    expect(screen.getByText('😀🎉')).toBeInTheDocument();
  });

  it('falls back to initials when the image already failed before hydration', () => {
    const completeSpy = jest
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const widthSpy = jest
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(0);
    render(<Avatar src="/broken.jpg" name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    completeSpy.mockRestore();
    widthSpy.mockRestore();
  });

  it('forwards imageProps to the underlying img', () => {
    render(
      <Avatar src="/photo.jpg" name="Ada" imageProps={{ loading: 'lazy' }} />
    );
    const img = screen.getByRole('img', { name: 'Ada' });
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('chains imageProps.onError before falling back', () => {
    const onError = jest.fn();
    render(
      <Avatar src="/broken.jpg" name="Ada Lovelace" imageProps={{ onError }} />
    );
    const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    fireEvent.error(img);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('prefers explicit initials over a derived name', () => {
    render(<Avatar name="Ada Lovelace" initials="xy" />);
    expect(screen.getByText('XY')).toBeInTheDocument();
  });

  it('falls back to the provided icon when there is no src/name/initials', () => {
    render(<Avatar icon={<span data-testid="fallback-icon" />} />);
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
  });

  it('renders a generic default icon when nothing else is provided', () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies a deterministic auto color from the name', () => {
    const colorPattern = /is-(primary|link|info|success|warning|danger)\b/;
    const { container: c1 } = render(<Avatar name="Ada Lovelace" />);
    const { container: c2 } = render(<Avatar name="Ada Lovelace" />);
    const class1 = (c1.firstChild as HTMLElement).className;
    const class2 = (c2.firstChild as HTMLElement).className;
    expect(class1).toMatch(colorPattern);
    expect(class1.match(colorPattern)?.[0]).toBe(
      class2.match(colorPattern)?.[0]
    );
  });

  it('lets an explicit color override the auto color', () => {
    render(<Avatar name="Ada Lovelace" color="info" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-info');
  });

  it('applies the shape class (defaults to circle)', () => {
    render(<Avatar name="Ada" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-circle');
  });

  it('applies a custom shape', () => {
    render(<Avatar name="Ada" shape="square" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-square');
  });

  it('applies a preset size class', () => {
    render(<Avatar name="Ada" size="64x64" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-64x64');
  });

  it('applies an inline pixel size when size is a number', () => {
    render(<Avatar name="Ada" size={20} data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');
    expect(avatar).not.toHaveClass('is-20');
    expect(avatar).toHaveStyle({ width: '20px', height: '20px' });
  });

  it('renders as a figure by default', () => {
    const { container } = render(<Avatar name="Ada" />);
    expect(container.firstChild?.nodeName).toBe('FIGURE');
  });

  it('renders as a link when href is provided', () => {
    render(<Avatar name="Ada" href="https://example.com" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('forwards target and rel when rendering a link', () => {
    render(
      <Avatar
        name="Ada"
        href="https://example.com"
        target="_blank"
        rel="noopener"
      />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  it('forwards href to a custom component rendered via as', () => {
    const CustomLink: React.FC<{
      href?: string;
      children?: React.ReactNode;
    }> = ({ href, children, ...rest }) => (
      <a data-testid="custom" href={href} {...rest}>
        {children}
      </a>
    );
    render(<Avatar name="Ada" as={CustomLink} href="https://example.com" />);
    expect(screen.getByTestId('custom')).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('omits the link props it has no value for, rather than forwarding undefined', () => {
    // A key that merely EXISTS is not free: it reads as a link to a target that
    // tests for one, and it travels on through a target's own `{...rest}`. NOT a
    // destructuring default, which an explicit `undefined` triggers anyway. The
    // type is what stops a TypeScript caller omitting an `href` the target
    // requires; this is the shape a plain-JavaScript caller or a loose spread
    // arrives in (#665).
    const seen: Record<string, unknown>[] = [];
    const Probe: React.FC<{
      href?: string;
      target?: string;
      rel?: string;
      children?: React.ReactNode;
    }> = props => {
      seen.push(props);
      return <a data-testid="probe">{props.children}</a>;
    };
    render(<Avatar name="Ada" as={Probe} />);
    expect(seen).toHaveLength(1);
    expect(seen[0]).not.toHaveProperty('href');
    expect(seen[0]).not.toHaveProperty('target');
    expect(seen[0]).not.toHaveProperty('rel');
  });

  it('respects an explicit as override', () => {
    const { container } = render(<Avatar name="Ada" as="div" />);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders as a button without a redundant role but keeps the aria-label', () => {
    render(<Avatar name="Ada Lovelace" as="button" />);
    // A button is already interactive, so no role="img" is added, but the
    // accessible name still comes from the aria-label.
    const button = screen.getByRole('button', { name: 'Ada Lovelace' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).not.toHaveAttribute('role', 'img');
  });

  it('passes Bulma helper props through', () => {
    render(<Avatar name="Ada" m="3" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('m-3');
  });

  it('applies a custom className', () => {
    render(<Avatar name="Ada" className="extra" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('extra');
  });

  it('sets role and aria-label when not showing an image', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(
      screen.getByRole('img', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
  });

  it('applies the classPrefix from ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Avatar name="Ada" data-testid="avatar" />
      </ConfigProvider>
    );
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('bulma-avatar');
    expect(avatar).not.toHaveClass('avatar');
  });
});

describe('Custom element targets', () => {
  it('keeps role="img" on a custom element with no href', () => {
    // A custom element is not inherently interactive — it is a string tag with
    // consumer-declared props, and without an href it is still a picture.
    render(<Avatar as={'x-avatar' as never} name="Ada" data-testid="a" />);
    expect(screen.getByTestId('a')).toHaveAttribute('role', 'img');
  });

  it('drops role="img" once the custom element has an href', () => {
    render(
      <Avatar as={'x-avatar' as never} href="/p" name="Ada" data-testid="a" />
    );
    const el = screen.getByTestId('a');
    expect(el).not.toHaveAttribute('role', 'img');
    expect(el).toHaveAttribute('href', '/p');
  });
});

describe('Custom component targets (#668)', () => {
  // A router link: it takes `to`, builds the anchor itself, and never sees
  // Avatar's own `href` — so Avatar cannot read "link" off the props it got.
  const RouterLink = ({
    to,
    children,
    ...rest
  }: { to: string } & React.ComponentProps<'a'>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  );

  it('keeps link semantics for an initials avatar with no href of ours', () => {
    render(<Avatar as={RouterLink} to="/profile" name="Ada" data-testid="a" />);
    const el = screen.getByTestId('a');
    expect(el).toHaveAttribute('href', '/profile');
    expect(el).not.toHaveAttribute('role', 'img');
    // A link still needs its accessible name.
    expect(el).toHaveAttribute('aria-label', 'Ada');
  });

  it('does not let alt="" mark a custom link decorative', () => {
    render(
      <Avatar as={RouterLink} to="/profile" alt="" name="Ada" data-testid="a" />
    );
    const el = screen.getByTestId('a');
    expect(el).not.toHaveAttribute('aria-hidden');
    expect(el).toHaveAttribute('aria-label', 'Ada');
  });

  it('leaves an image avatar unchanged', () => {
    render(
      <Avatar
        as={RouterLink}
        to="/profile"
        src="/photo.jpg"
        alt="Ada"
        data-testid="a"
      />
    );
    const el = screen.getByTestId('a');
    expect(el).not.toHaveAttribute('role', 'img');
    expect(screen.getByAltText('Ada')).toHaveAttribute('src', '/photo.jpg');
  });

  it('leaves a plain <figure> avatar unchanged', () => {
    render(<Avatar name="Ada" data-testid="a" />);
    const el = screen.getByTestId('a');
    expect(el.tagName).toBe('FIGURE');
    expect(el).toHaveAttribute('role', 'img');
    expect(el).toHaveAttribute('aria-label', 'Ada');
  });

  // The guess is the caller's to correct — and correcting it has to reach every
  // behaviour interactivity drives, not just the role attribute.
  describe('an explicit role/aria-hidden settles the guess', () => {
    const Wrapper = (props: React.ComponentProps<'figure'>) => (
      <figure {...props} />
    );

    it('treats a custom target declaring a role as the picture it says it is', () => {
      render(<Avatar as={Wrapper} name="Ada" role="img" data-testid="a" />);
      const el = screen.getByTestId('a');
      expect(el).toHaveAttribute('role', 'img');
      expect(el).toHaveAttribute('aria-label', 'Ada');
    });

    it('restores the alt="" decorative opt-out, without a stray label', () => {
      render(
        <Avatar as={Wrapper} alt="" name="Ada" role="img" data-testid="a" />
      );
      const el = screen.getByTestId('a');
      expect(el).toHaveAttribute('aria-hidden', 'true');
      expect(el).not.toHaveAttribute('aria-label');
    });

    it('accepts aria-hidden as the signal too', () => {
      render(
        <Avatar as={Wrapper} alt="" name="Ada" aria-hidden data-testid="a" />
      );
      const el = screen.getByTestId('a');
      expect(el).toHaveAttribute('aria-hidden', 'true');
      expect(el).not.toHaveAttribute('aria-label');
    });

    it('keeps a decorative image avatar free of the name fallback', () => {
      render(
        <Avatar as={Wrapper} src="/p.jpg" alt="" role="img" data-testid="a" />
      );
      expect(screen.getByTestId('a')).not.toHaveAttribute('aria-label');
    });

    it('ignores a role that claims the opposite, such as button', () => {
      // role="button" asserts a control. Reading it as "I am a picture" handed an
      // interactive-role element aria-hidden and no name.
      render(
        <Avatar
          as={RouterLink}
          to="/profile"
          alt=""
          name="Ada"
          role="button"
          data-testid="a"
        />
      );
      const el = screen.getByTestId('a');
      expect(el).not.toHaveAttribute('aria-hidden');
      expect(el).toHaveAttribute('aria-label', 'Ada');
      expect(el).toHaveAttribute('role', 'button');
    });

    it.each(['presentation', 'none'])(
      'accepts role=%s as the same signal as role="img"',
      role => {
        render(
          <Avatar
            as={RouterLink}
            to="/profile"
            alt=""
            name="Ada"
            role={role}
            data-testid="a"
          />
        );
        expect(screen.getByTestId('a')).toHaveAttribute('aria-hidden', 'true');
      }
    );

    it('is outranked by an href, which ends the guess', () => {
      // A custom target we were handed an href for is known to be a link, so the
      // signal cannot hide it or strip its name.
      render(
        <Avatar
          as={RouterLink}
          to="/profile"
          href="/profile"
          alt=""
          name="Ada"
          role="img"
          data-testid="a"
        />
      );
      const el = screen.getByTestId('a');
      expect(el).not.toHaveAttribute('aria-hidden');
      expect(el).toHaveAttribute('aria-label', 'Ada');
    });

    it('does not read aria-hidden={false} as a claim to be a picture', () => {
      // Denying hiding is the opposite claim, so the link keeps link semantics.
      render(
        <Avatar
          as={RouterLink}
          to="/profile"
          name="Ada"
          aria-hidden={false}
          data-testid="a"
        />
      );
      expect(screen.getByTestId('a')).not.toHaveAttribute('role', 'img');
    });

    it('does not let the signal waive the name on a real link, where we are not guessing', () => {
      render(
        <Avatar href="/profile" alt="" name="Ada" role="img" data-testid="a" />
      );
      const el = screen.getByTestId('a');
      expect(el).not.toHaveAttribute('aria-hidden');
      expect(el).toHaveAttribute('aria-label', 'Ada');
    });
  });
});

describe('Ref forwarding', () => {
  // Avatar gained ref forwarding with #641. The ref lands on the root element,
  // which `as` names — not on the inner <img>.
  it('forwards ref to the root <figure> by default', () => {
    const ref = createRef<HTMLElement>();
    render(<Avatar name="Ada" ref={ref} data-testid="avatar" />);
    expect(ref.current).toBe(screen.getByTestId('avatar'));
    expect(ref.current?.tagName).toBe('FIGURE');
  });

  it('forwards ref to the <a> an href selects', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Avatar name="Ada" href="https://example.com" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});

describe('Link attributes on an as that cannot be a link (#733)', () => {
  // The type offers `href` and `target` on any target that declares none, so a
  // plain element accepts them; the runtime keeps them off it, since
  // `<div href>` is invalid HTML. The drop stays, and development says so.
  // `rel` is the element's own attribute on every intrinsic `as`, so it is not
  // part of this warning.
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    resetDevWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each(['figure', 'div', 'button'] as const)(
    'drops the href on as="%s" and warns once in development',
    tag => {
      const { container, rerender } = render(
        <Avatar name="Ada" as={tag} href="/profile" />
      );
      rerender(<Avatar name="Ada" as={tag} href="/profile" />);
      const el = container.firstChild as HTMLElement;
      expect(el.nodeName).toBe(tag.toUpperCase());
      expect(el).not.toHaveAttribute('href');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message: string = warnSpy.mock.calls[0][0];
      expect(message).toContain(`<Avatar as="${tag}" href>`);
      expect(message).toContain(`<${tag}> renders without "href",`);
      // The message names the fix, not just the problem.
      expect(message).toContain('as="a"');
    }
  );

  it('warns for a target alone, naming only the target', () => {
    const { container } = render(
      <Avatar name="Ada" as="div" target="_blank" />
    );
    expect(container.firstChild).not.toHaveAttribute('target');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message: string = warnSpy.mock.calls[0][0];
    expect(message).toContain('<Avatar as="div" target>');
    expect(message).toContain('renders without "target",');
    expect(message).not.toContain('"href"');
  });

  it('names href and target together, in one warning', () => {
    const { container } = render(
      <Avatar name="Ada" as="div" href="/profile" target="_blank" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el).not.toHaveAttribute('href');
    expect(el).not.toHaveAttribute('target');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message: string = warnSpy.mock.calls[0][0];
    expect(message).toContain('<Avatar as="div" href target>');
    expect(message).toContain('renders without "href" and "target",');
  });

  it('does not warn for a rel alone', () => {
    // React declares `rel` on every element, so on a plain `as` it is the
    // element's own attribute, and "render it as a link" is the wrong advice.
    render(<Avatar name="Ada" as="div" rel="noopener" />);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('leaves rel out of a warning the other attributes raise', () => {
    render(<Avatar name="Ada" as="div" target="_blank" rel="noopener" />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message: string = warnSpy.mock.calls[0][0];
    expect(message).toContain('<Avatar as="div" target>');
    expect(message).not.toContain('"rel"');
  });

  it('warns once for the element, not once per avatar or combination', () => {
    render(
      <>
        <Avatar name="Ada" as="div" href="/ada" />
        <Avatar name="Grace" as="div" href="/grace" />
        <Avatar name="Hedy" as="div" target="_blank" />
        <Avatar name="Katherine" as="figure" href="/katherine" />
      </>
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('stays quiet for link attributes when the caller passed no as', () => {
    // With no `as` and no href the element is Avatar's own figure, so there is
    // no `as` in the caller's source for a warning to name.
    render(<Avatar name="Ada" target="_blank" rel="noopener" />);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('stays quiet when the target can be a link', () => {
    const CustomLink: React.FC<{
      href?: string;
      children?: React.ReactNode;
    }> = ({ href, children, ...rest }) => (
      <a data-testid="custom" href={href} {...rest}>
        {children}
      </a>
    );
    render(
      <>
        <Avatar name="Ada" href="/profile" data-testid="default" />
        <Avatar name="Ada" as="a" href="/profile" data-testid="anchor" />
        <Avatar
          name="Ada"
          as={'x-avatar' as never}
          href="/profile"
          data-testid="element"
        />
        <Avatar name="Ada" as={CustomLink} href="/profile" />
      </>
    );
    for (const id of ['default', 'anchor', 'element', 'custom']) {
      expect(screen.getByTestId(id)).toHaveAttribute('href', '/profile');
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('stays quiet on a plain element given no href', () => {
    render(<Avatar name="Ada" as="div" />);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('stays quiet for an empty href with no as, which picks the figure itself', () => {
    // An empty href chooses `figure` by the same truthiness test that picks
    // `a`, so there is no `as` in the caller's source for a warning to name.
    const { container } = render(<Avatar name="Ada" href="" />);
    const el = container.firstChild as HTMLElement;
    expect(el.nodeName).toBe('FIGURE');
    expect(el).not.toHaveAttribute('href');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('stays quiet for an empty href on an explicit plain element', () => {
    // An empty href asks for no link, so nothing the caller meant was lost.
    const { container } = render(<Avatar name="Ada" as="div" href="" />);
    const el = container.firstChild as HTMLElement;
    expect(el.nodeName).toBe('DIV');
    expect(el).not.toHaveAttribute('href');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn in production', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const { container } = render(
        <Avatar name="Ada" as="div" href="/profile" />
      );
      expect(container.firstChild).not.toHaveAttribute('href');
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
