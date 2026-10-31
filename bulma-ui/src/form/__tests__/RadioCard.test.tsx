import { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { RadioCard, type RadioCardProps } from '../RadioCard';
import { radioColors } from '../Radio';
import { Radios } from '../Radios';
import { ConfigProvider } from '../../helpers/Config';

/** Whether two types are the same, both ways round. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

const radio = (name: string) =>
  screen.getByRole('radio', { name }) as HTMLInputElement;

describe('RadioCard', () => {
  describe('markup', () => {
    it('is a card label with the input first, then the indicator and the text', () => {
      render(
        <RadioCard title="Express" description="Arrives tomorrow.">
          <span data-testid="extra">$12</span>
        </RadioCard>
      );
      const input = radio('Express');
      const label = input.closest('label')!;
      expect(label).toHaveClass('radio-card', 'card');
      expect(label.firstElementChild).toBe(input);
      expect(input).toHaveAttribute('type', 'radio');

      const content = input.nextElementSibling!;
      expect(content).toHaveClass('card-content', 'radio-card-content');
      const [check, body] = Array.from(content.children);
      expect(check).toHaveClass('radio-card-check');
      expect(body).toHaveClass('radio-card-body');
      expect(body.querySelector('.radio-card-title')).toHaveTextContent(
        'Express'
      );
      expect(body.querySelector('.radio-card-description')).toHaveTextContent(
        'Arrives tomorrow.'
      );
      expect(screen.getByTestId('extra').parentElement).toBe(body);
    });

    it('leaves out the indicator with hasIndicator={false}', () => {
      render(<RadioCard hasIndicator={false} title="Tile" />);
      const content = radio('Tile').nextElementSibling!;
      expect(content.querySelector('.radio-card-check')).toBeNull();
    });

    it('renders no title or description span without them', () => {
      render(<RadioCard>Just text</RadioCard>);
      const label = radio('Just text').closest('label')!;
      expect(label.querySelector('.radio-card-title')).toBeNull();
      expect(label.querySelector('.radio-card-description')).toBeNull();
    });
  });

  describe('name and description', () => {
    it('is named by the title and described by the description', () => {
      render(<RadioCard title="Express" description="Arrives tomorrow." />);
      const input = screen.getByRole('radio', {
        name: 'Express',
        description: 'Arrives tomorrow.',
      });
      const label = input.closest('label')!;
      expect(input).toHaveAttribute(
        'aria-labelledby',
        label.querySelector('.radio-card-title')!.id
      );
      expect(input).toHaveAttribute(
        'aria-describedby',
        label.querySelector('.radio-card-description')!.id
      );
    });

    it("is named by the label's own text without a title, and not described again", () => {
      render(<RadioCard description="Arrives tomorrow.">Express</RadioCard>);
      const input = screen.getByRole('radio');
      expect(input).not.toHaveAttribute('aria-labelledby');
      expect(input).not.toHaveAttribute('aria-describedby');
      expect(input).toHaveAccessibleName('Arrives tomorrow. Express');
    });

    it('lets an aria-label win over the title, and still describes', () => {
      render(
        <RadioCard aria-label="Fast" title="Express" description="Soon." />
      );
      const input = screen.getByRole('radio', {
        name: 'Fast',
        description: 'Soon.',
      });
      expect(input).not.toHaveAttribute('aria-labelledby');
    });

    it('lets aria-labelledby and aria-describedby passed in win', () => {
      render(
        <>
          <span id="name">Outside name</span>
          <span id="hint">Outside hint</span>
          <RadioCard
            aria-labelledby="name"
            aria-describedby="hint"
            title="Express"
            description="Soon."
          />
        </>
      );
      expect(
        screen.getByRole('radio', {
          name: 'Outside name',
          description: 'Outside hint',
        })
      ).toBeInTheDocument();
    });
  });

  describe('clicks and state', () => {
    it('is picked from a click anywhere on the card', () => {
      render(
        <>
          <RadioCard
            name="ship"
            value="std"
            title="Standard"
            description="4 to 6 days."
          />
          <RadioCard
            name="ship"
            value="exp"
            title="Express"
            description="Tomorrow."
          />
        </>
      );
      fireEvent.click(screen.getByText('Tomorrow.'));
      expect(radio('Express').checked).toBe(true);
      fireEvent.click(screen.getByText('Standard'));
      expect(radio('Standard').checked).toBe(true);
      expect(radio('Express').checked).toBe(false);
    });

    it('is disabled, and a click changes nothing', () => {
      const onChange = vi.fn();
      render(<RadioCard disabled onChange={onChange} title="Off" />);
      expect(radio('Off')).toBeDisabled();
      fireEvent.click(screen.getByText('Off'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('sends the picked value with a form', () => {
      const { container } = render(
        <form>
          <RadioCard name="ship" value="std" title="Standard" />
          <RadioCard name="ship" value="exp" defaultChecked title="Express" />
        </form>
      );
      expect(new FormData(container.querySelector('form')!).get('ship')).toBe(
        'exp'
      );
    });
  });

  describe('where props land', () => {
    it('puts className and helper props on the card, the rest on the input', () => {
      render(
        <RadioCard
          className="ship-card"
          mb="2"
          textColor="info"
          style={{ color: 'red' }}
          data-probe=""
          title="Express"
        />
      );
      const input = radio('Express');
      const label = input.closest('label')!;
      expect(label).toHaveClass('ship-card', 'mb-2', 'has-text-info');
      expect(label).not.toHaveAttribute('style');
      expect(input).toHaveAttribute('style', 'color: red;');
      expect(input).toHaveAttribute('data-probe', '');
    });

    it('takes the colors Radio takes, and adds a class for each', () => {
      // A compile-time check: the two lists are the same, both ways round.
      const same: Same<
        NonNullable<RadioCardProps['color']>,
        (typeof radioColors)[number]
      > = true;
      expect(same).toBe(true);
      for (const color of radioColors) {
        const { unmount } = render(<RadioCard color={color} title={color} />);
        expect(radio(color).closest('label')).toHaveClass(`is-${color}`);
        unmount();
      }
    });

    it('adds a color class for each color it takes, and none for another', () => {
      const { rerender } = render(<RadioCard color="danger" title="Card" />);
      expect(radio('Card').closest('label')).toHaveClass('is-danger');
      rerender(
        // @ts-expect-error -- a value from outside the type, as at runtime
        <RadioCard color="purple" title="Card" />
      );
      expect(radio('Card').closest('label')!.className).not.toMatch(/is-/);
    });

    it('forwards the ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      render(<RadioCard ref={ref} title="Ref" />);
      expect(ref.current).toBe(radio('Ref'));
    });

    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <RadioCard color="link" mt="2" title="Prefixed" description="Yes" />
        </ConfigProvider>
      );
      const classes = Array.from(container.querySelectorAll('[class]')).flatMap(
        el => Array.from(el.classList)
      );
      expect(classes.length).toBeGreaterThan(0);
      for (const name of classes) expect(name).toMatch(/^bestax-/);
      expect(container.querySelector('label')).toHaveClass(
        'bestax-radio-card',
        'bestax-card',
        'bestax-is-link'
      );
    });
  });

  describe('in a Radios group', () => {
    it("takes the group's name, and its own wins", () => {
      render(
        <Radios name="ship">
          <RadioCard value="std" title="Group name" />
          <RadioCard value="exp" name="own" title="Own name" />
        </Radios>
      );
      expect(radio('Group name')).toHaveAttribute('name', 'ship');
      expect(radio('Own name')).toHaveAttribute('name', 'own');
    });

    it('starts from the group defaultValue and reports changes, uncontrolled', () => {
      const onChange = vi.fn();
      render(
        <Radios name="ship" defaultValue="std" onChange={onChange}>
          <RadioCard value="std" title="Standard" />
          <RadioCard value="exp" title="Express" />
        </Radios>
      );
      expect(radio('Standard').checked).toBe(true);
      fireEvent.click(screen.getByText('Express'));
      expect(onChange).toHaveBeenLastCalledWith('exp');
      expect(radio('Express').checked).toBe(true);
      expect(radio('Standard').checked).toBe(false);
    });

    it('follows the group value, controlled', () => {
      function Harness() {
        const [ship, setShip] = useState('std');
        return (
          <>
            <Radios name="ship" value={ship} onChange={setShip}>
              <RadioCard value="std" title="Standard" />
              <RadioCard value="exp" title="Express" />
            </Radios>
            <output>{ship}</output>
          </>
        );
      }
      render(<Harness />);
      fireEvent.click(radio('Express'));
      expect(screen.getByRole('status')).toHaveTextContent('exp');
      expect(radio('Express').checked).toBe(true);
    });

    it('lets its own checked win over the group', () => {
      render(
        <Radios value="std" onChange={() => {}}>
          <RadioCard
            value="std"
            checked={false}
            onChange={() => {}}
            title="Standard"
          />
        </Radios>
      );
      expect(radio('Standard').checked).toBe(false);
    });

    it('keeps its own defaultChecked when the group leaves the selection alone', () => {
      render(
        <Radios name="ship">
          <RadioCard value="exp" defaultChecked title="Express" />
        </Radios>
      );
      expect(radio('Express').checked).toBe(true);
    });

    it('tells the group nothing without a value, but still calls its own onChange', () => {
      const group = vi.fn();
      const own = vi.fn();
      render(
        <Radios onChange={group}>
          <RadioCard onChange={own} title="No value" />
        </Radios>
      );
      fireEvent.click(radio('No value'));
      expect(own).toHaveBeenCalledTimes(1);
      expect(group).not.toHaveBeenCalled();
    });

    it('sits in a radiogroup named by the group label', () => {
      render(
        <Radios label="Shipping" name="ship">
          <RadioCard value="std" title="Standard" />
        </Radios>
      );
      expect(
        screen.getByRole('radiogroup', { name: 'Shipping' })
      ).toContainElement(radio('Standard'));
    });
  });

  describe('server rendering', () => {
    it('hydrates without a mismatch', async () => {
      const ui = (
        <Radios name="ship" defaultValue="exp">
          <RadioCard value="std" title="Standard" description="Slow." />
          <RadioCard value="exp" title="Express" description="Fast." />
        </Radios>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, ui);
        });
        expect(error).not.toHaveBeenCalled();
        expect(
          screen.getByRole('radio', { name: 'Express', description: 'Fast.' })
        ).toBeChecked();
      } finally {
        error.mockRestore();
        await act(async () => root!.unmount());
        container.remove();
      }
    });
  });
});
