import { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { CheckboxCard, type CheckboxCardProps } from '../CheckboxCard';
import { checkboxColors } from '../Checkbox';
import { Checkboxes } from '../Checkboxes';
import { Field } from '../Field';
import { ConfigProvider } from '../../helpers/Config';

/** Whether two types are the same, both ways round. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

const box = (name: string) =>
  screen.getByRole('checkbox', { name }) as HTMLInputElement;

describe('CheckboxCard', () => {
  describe('markup', () => {
    it('is a card label with the input first, then the indicator and the text', () => {
      render(
        <CheckboxCard title="Daily backups" description="Kept for 30 days.">
          <span data-testid="extra">$5 a month</span>
        </CheckboxCard>
      );
      const input = box('Daily backups');
      const label = input.closest('label')!;
      expect(label).toHaveClass('checkbox-card', 'card');
      expect(label.firstElementChild).toBe(input);
      expect(input).toHaveAttribute('type', 'checkbox');

      const content = input.nextElementSibling!;
      expect(content.tagName).toBe('SPAN');
      expect(content).toHaveClass('card-content', 'checkbox-card-content');
      const [check, body] = Array.from(content.children);
      expect(check).toHaveClass('checkbox-card-check');
      expect(body).toHaveClass('checkbox-card-body');
      expect(body.querySelector('.checkbox-card-title')).toHaveTextContent(
        'Daily backups'
      );
      expect(
        body.querySelector('.checkbox-card-description')
      ).toHaveTextContent('Kept for 30 days.');
      expect(screen.getByTestId('extra').parentElement).toBe(body);
    });

    it('renders only spans inside the label, which holds phrasing content', () => {
      const { container } = render(
        <CheckboxCard title="Title" description="Description" />
      );
      const tags = Array.from(
        container.querySelectorAll('label *'),
        el => el.tagName
      );
      expect(new Set(tags)).toEqual(new Set(['INPUT', 'SPAN']));
    });

    it('leaves out the indicator with hasIndicator={false}', () => {
      render(<CheckboxCard hasIndicator={false} title="Tile" />);
      const content = box('Tile').nextElementSibling!;
      expect(content.querySelector('.checkbox-card-check')).toBeNull();
      expect(content.firstElementChild).toHaveClass('checkbox-card-body');
    });

    it('renders no title or description span without them', () => {
      render(<CheckboxCard>Just text</CheckboxCard>);
      const body = box('Just text').closest('label')!;
      expect(body.querySelector('.checkbox-card-title')).toBeNull();
      expect(body.querySelector('.checkbox-card-description')).toBeNull();
    });
  });

  describe('name and description', () => {
    it('is named by the title and described by the description', () => {
      render(
        <CheckboxCard title="Daily backups" description="Kept for 30 days.">
          $5 a month
        </CheckboxCard>
      );
      const input = screen.getByRole('checkbox', {
        name: 'Daily backups',
        description: 'Kept for 30 days.',
      });
      const title = input
        .closest('label')!
        .querySelector('.checkbox-card-title')!;
      const description = input
        .closest('label')!
        .querySelector('.checkbox-card-description')!;
      expect(input).toHaveAttribute('aria-labelledby', title.id);
      expect(input).toHaveAttribute('aria-describedby', description.id);
      expect(title.id).not.toBe(description.id);
    });

    it('gives each card its own ids', () => {
      render(
        <>
          <CheckboxCard title="One" description="First" />
          <CheckboxCard title="Two" description="Second" />
        </>
      );
      const ids = [box('One'), box('Two')].flatMap(input => [
        input.getAttribute('aria-labelledby'),
        input.getAttribute('aria-describedby'),
      ]);
      expect(new Set(ids).size).toBe(4);
    });

    it("is named by the label's own text without a title, and not described again", () => {
      render(
        <>
          {/* The card's own rule. A block description keeps its text apart
              from what follows it in the name. */}
          <style>{'.checkbox-card-description { display: block; }'}</style>
          <CheckboxCard description="Kept for 30 days.">
            Daily backups
          </CheckboxCard>
        </>
      );
      const input = screen.getByRole('checkbox');
      expect(input).not.toHaveAttribute('aria-labelledby');
      expect(input).not.toHaveAttribute('aria-describedby');
      expect(input).toHaveAccessibleName('Kept for 30 days. Daily backups');
    });

    it('lets an aria-label win over the title, and still describes', () => {
      render(
        <CheckboxCard
          aria-label="Backups"
          title="Daily backups"
          description="Kept."
        />
      );
      const input = screen.getByRole('checkbox', {
        name: 'Backups',
        description: 'Kept.',
      });
      expect(input).not.toHaveAttribute('aria-labelledby');
    });

    it('lets an aria-labelledby win over the title', () => {
      render(
        <>
          <span id="outside">Outside name</span>
          <CheckboxCard
            aria-labelledby="outside"
            title="Daily backups"
            description="Kept."
          />
        </>
      );
      expect(
        screen.getByRole('checkbox', {
          name: 'Outside name',
          description: 'Kept.',
        })
      ).toBeInTheDocument();
    });

    it('takes the title when the aria-labelledby passed in is empty', () => {
      render(<CheckboxCard aria-labelledby="" title="Daily backups" />);
      expect(box('Daily backups')).toBeInTheDocument();
    });

    it('lets an aria-describedby win over the description', () => {
      render(
        <>
          <span id="hint">Outside hint</span>
          <CheckboxCard
            aria-describedby="hint"
            title="Backups"
            description="Kept."
          />
        </>
      );
      expect(
        screen.getByRole('checkbox', {
          name: 'Backups',
          description: 'Outside hint',
        })
      ).toBeInTheDocument();
    });
  });

  describe('clicks and state', () => {
    it('toggles from a click anywhere on the card', () => {
      render(
        <CheckboxCard title="Daily backups" description="Kept for 30 days.">
          <span data-testid="extra">$5</span>
        </CheckboxCard>
      );
      const input = box('Daily backups');
      fireEvent.click(screen.getByText('Daily backups'));
      expect(input.checked).toBe(true);
      fireEvent.click(screen.getByText('Kept for 30 days.'));
      expect(input.checked).toBe(false);
      fireEvent.click(screen.getByTestId('extra'));
      expect(input.checked).toBe(true);
      fireEvent.click(input.closest('label')!);
      expect(input.checked).toBe(false);
    });

    it('follows a link inside it without toggling', () => {
      render(
        <CheckboxCard title="Terms" description="Read them first.">
          <a href="#terms">The terms</a>
        </CheckboxCard>
      );
      fireEvent.click(screen.getByRole('link', { name: 'The terms' }));
      expect(box('Terms').checked).toBe(false);
      // The link's text stays out of the checkbox's name.
      expect(box('Terms')).toHaveAccessibleName('Terms');
    });

    it('starts from defaultChecked, uncontrolled', () => {
      render(<CheckboxCard defaultChecked title="On" />);
      expect(box('On').checked).toBe(true);
    });

    it('follows checked, controlled', () => {
      function Harness() {
        const [on, setOn] = useState(false);
        return (
          <CheckboxCard
            checked={on}
            onChange={e => setOn(e.target.checked)}
            title="Controlled"
          />
        );
      }
      render(<Harness />);
      fireEvent.click(box('Controlled'));
      expect(box('Controlled').checked).toBe(true);
    });

    it('is disabled, and a click changes nothing', () => {
      const onChange = vi.fn();
      render(<CheckboxCard disabled onChange={onChange} title="Off" />);
      const input = box('Off');
      expect(input).toBeDisabled();
      fireEvent.click(screen.getByText('Off'));
      expect(onChange).not.toHaveBeenCalled();
      expect(input.checked).toBe(false);
    });

    it('sends its name and value with a form', () => {
      const { container } = render(
        <form>
          <CheckboxCard
            name="extras"
            value="backups"
            defaultChecked
            title="Backups"
          />
          <CheckboxCard name="extras" value="domain" title="Domain" />
        </form>
      );
      const data = new FormData(container.querySelector('form')!);
      expect(data.getAll('extras')).toEqual(['backups']);
    });
  });

  describe('where props land', () => {
    it('puts className and helper props on the card, the rest on the input', () => {
      render(
        <CheckboxCard
          className="plan-card"
          mt="3"
          textColor="primary"
          style={{ color: 'red' }}
          data-probe=""
          id="backups"
          title="Backups"
        />
      );
      const input = box('Backups');
      const label = input.closest('label')!;
      expect(label).toHaveClass('plan-card', 'mt-3', 'has-text-primary');
      expect(label).not.toHaveAttribute('style');
      expect(label).not.toHaveAttribute('data-probe');
      expect(input).toHaveAttribute('style', 'color: red;');
      expect(input).toHaveAttribute('data-probe', '');
      expect(input).toHaveAttribute('id', 'backups');
    });

    it('takes the colors Checkbox takes, and adds a class for each', () => {
      // A compile-time check: the two lists are the same, both ways round.
      const same: Same<
        NonNullable<CheckboxCardProps['color']>,
        (typeof checkboxColors)[number]
      > = true;
      expect(same).toBe(true);
      for (const color of checkboxColors) {
        const { unmount } = render(
          <CheckboxCard color={color} title={color} />
        );
        expect(box(color).closest('label')).toHaveClass(`is-${color}`);
        unmount();
      }
    });

    it('adds a color class for each color it takes, and none for another', () => {
      const { rerender } = render(
        <CheckboxCard color="success" title="Card" />
      );
      expect(box('Card').closest('label')).toHaveClass('is-success');
      rerender(
        // @ts-expect-error -- a value from outside the type, as at runtime
        <CheckboxCard color="purple" title="Card" />
      );
      expect(box('Card').closest('label')!.className).not.toMatch(/is-/);
    });

    it('forwards an object ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      render(<CheckboxCard ref={ref} title="Ref" />);
      expect(ref.current).toBe(box('Ref'));
    });

    it('forwards a callback ref to the input', () => {
      const ref = vi.fn();
      const { unmount } = render(<CheckboxCard ref={ref} title="Ref" />);
      expect(ref).toHaveBeenLastCalledWith(box('Ref'));
      unmount();
      expect(ref).toHaveBeenLastCalledWith(null);
    });

    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <CheckboxCard
            color="info"
            mt="2"
            title="Prefixed"
            description="Yes"
          />
        </ConfigProvider>
      );
      const classes = Array.from(container.querySelectorAll('[class]')).flatMap(
        el => Array.from(el.classList)
      );
      expect(classes.length).toBeGreaterThan(0);
      for (const name of classes) expect(name).toMatch(/^bestax-/);
      expect(container.querySelector('label')).toHaveClass(
        'bestax-checkbox-card',
        'bestax-card',
        'bestax-is-info'
      );
    });
  });

  describe('in a Checkboxes group', () => {
    it("takes the group's name, and its own wins", () => {
      render(
        <Checkboxes name="extras">
          <CheckboxCard value="a" title="Group name" />
          <CheckboxCard value="b" name="own" title="Own name" />
        </Checkboxes>
      );
      expect(box('Group name')).toHaveAttribute('name', 'extras');
      expect(box('Own name')).toHaveAttribute('name', 'own');
    });

    it('starts from the group defaultValue and reports changes, uncontrolled', () => {
      const onChange = vi.fn();
      render(
        <Checkboxes
          name="extras"
          defaultValue={['backups']}
          onChange={onChange}
        >
          <CheckboxCard value="backups" title="Backups" />
          <CheckboxCard value="domain" title="Domain" />
        </Checkboxes>
      );
      expect(box('Backups').checked).toBe(true);
      expect(box('Domain').checked).toBe(false);
      fireEvent.click(screen.getByText('Domain'));
      expect(onChange).toHaveBeenLastCalledWith(['backups', 'domain']);
      expect(box('Domain').checked).toBe(true);
      fireEvent.click(screen.getByText('Backups'));
      expect(onChange).toHaveBeenLastCalledWith(['domain']);
      expect(box('Backups').checked).toBe(false);
    });

    it('follows the group value, controlled', () => {
      function Harness() {
        const [extras, setExtras] = useState<string[]>([]);
        return (
          <>
            <Checkboxes value={extras} onChange={setExtras}>
              <CheckboxCard value="backups" title="Backups" />
              <CheckboxCard value="domain" title="Domain" />
            </Checkboxes>
            <output>{extras.join(',')}</output>
          </>
        );
      }
      render(<Harness />);
      fireEvent.click(box('Domain'));
      fireEvent.click(box('Backups'));
      expect(screen.getByRole('status')).toHaveTextContent('domain,backups');
      expect(box('Domain').checked).toBe(true);
    });

    it('does not add a value twice', () => {
      const onChange = vi.fn();
      render(
        <Checkboxes value={['backups']} onChange={onChange}>
          <CheckboxCard value="backups" checked={false} title="Backups" />
        </Checkboxes>
      );
      fireEvent.click(box('Backups'));
      expect(onChange).toHaveBeenLastCalledWith(['backups']);
    });

    it('starts from an empty selection when the group has only onChange', () => {
      // A group with only onChange holds no value until the first change, so
      // React warns that the input went from uncontrolled to controlled. It
      // does the same for Checkbox; the group decides it, not the card.
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const onChange = vi.fn();
        render(
          <Checkboxes onChange={onChange}>
            <CheckboxCard value="backups" title="Backups" />
          </Checkboxes>
        );
        fireEvent.click(box('Backups'));
        expect(onChange).toHaveBeenLastCalledWith(['backups']);
      } finally {
        error.mockRestore();
      }
    });

    it('lets its own checked win over the group', () => {
      render(
        <Checkboxes value={['backups']} onChange={() => {}}>
          <CheckboxCard
            value="backups"
            checked={false}
            onChange={() => {}}
            title="Backups"
          />
        </Checkboxes>
      );
      expect(box('Backups').checked).toBe(false);
    });

    it('keeps its own defaultChecked when the group leaves the selection alone', () => {
      render(
        <Checkboxes name="extras">
          <CheckboxCard value="backups" defaultChecked title="Backups" />
        </Checkboxes>
      );
      expect(box('Backups').checked).toBe(true);
    });

    it('tells the group nothing without a value, but still calls its own onChange', () => {
      const group = vi.fn();
      const own = vi.fn();
      render(
        <Checkboxes onChange={group}>
          <CheckboxCard onChange={own} title="No value" />
        </Checkboxes>
      );
      fireEvent.click(box('No value'));
      expect(own).toHaveBeenCalledTimes(1);
      expect(group).not.toHaveBeenCalled();
    });

    it('is named by its title inside a labelled group', () => {
      render(
        <Checkboxes label="Add-ons">
          <CheckboxCard value="backups" title="Backups" description="Kept." />
        </Checkboxes>
      );
      expect(screen.getByRole('group', { name: 'Add-ons' })).toContainElement(
        box('Backups')
      );
    });

    it("leaves a Field's label to name the group, not the card", () => {
      render(
        <Field label="Add-ons">
          <Checkboxes>
            <CheckboxCard value="backups" title="Backups" />
          </Checkboxes>
        </Field>
      );
      expect(
        screen.getByRole('group', { name: 'Add-ons' })
      ).toBeInTheDocument();
      expect(box('Backups')).toBeInTheDocument();
    });
  });

  describe('indeterminate', () => {
    it('sets the mixed state on the input, not as an attribute', () => {
      render(<CheckboxCard indeterminate title="All" />);
      const input = box('All');
      expect(input.indeterminate).toBe(true);
      expect(input).toBePartiallyChecked();
      expect(input.hasAttribute('indeterminate')).toBe(false);
    });

    it('keeps the mixed state after a click', () => {
      const onChange = vi.fn();
      render(<CheckboxCard indeterminate onChange={onChange} title="All" />);
      const input = box('All');
      fireEvent.click(input);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(input.checked).toBe(true);
      expect(input.indeterminate).toBe(true);
    });

    it('follows the prop, and clears it once when the prop goes back to unset', () => {
      const { rerender } = render(<CheckboxCard indeterminate title="All" />);
      const input = box('All');
      rerender(<CheckboxCard indeterminate={false} title="All" />);
      expect(input.indeterminate).toBe(false);
      rerender(<CheckboxCard indeterminate title="All" />);
      expect(input.indeterminate).toBe(true);
      rerender(<CheckboxCard title="All" />);
      expect(input.indeterminate).toBe(false);
      // Handed back: a ref setting it now keeps what it set.
      input.indeterminate = true;
      rerender(<CheckboxCard title="All" />);
      expect(input.indeterminate).toBe(true);
    });

    it('still forwards a ref with it set', () => {
      const ref = createRef<HTMLInputElement>();
      render(<CheckboxCard ref={ref} indeterminate title="All" />);
      expect(ref.current?.indeterminate).toBe(true);
    });
  });

  describe('server rendering', () => {
    it('hydrates without a mismatch, with the same ids', async () => {
      const ui = (
        <Checkboxes name="extras" defaultValue={['backups']}>
          <CheckboxCard value="backups" title="Backups" description="Kept." />
          <CheckboxCard value="domain" title="Domain" description="Yours." />
        </Checkboxes>
      );
      const html = renderToString(ui);
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      const serverIds = Array.from(container.querySelectorAll('input'), input =>
        input.getAttribute('aria-labelledby')
      );
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, ui);
        });
        expect(error).not.toHaveBeenCalled();
        expect(
          Array.from(container.querySelectorAll('input'), input =>
            input.getAttribute('aria-labelledby')
          )
        ).toEqual(serverIds);
        expect(
          screen.getByRole('checkbox', {
            name: 'Backups',
            description: 'Kept.',
          })
        ).toBeChecked();
      } finally {
        error.mockRestore();
        await act(async () => root!.unmount());
        container.remove();
      }
    });
  });
});
