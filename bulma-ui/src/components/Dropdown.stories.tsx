import { useEffect, useRef, useState } from 'react';
import { Dropdown } from './Dropdown';

export default {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  subcomponents: { Item: Dropdown.Item, Divider: Dropdown.Divider },
};

export const Default = () => (
  <Dropdown label="Dropdown Menu">
    <Dropdown.Item>First Item</Dropdown.Item>
    <Dropdown.Item>Second Item</Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item>Third Item</Dropdown.Item>
    <Dropdown.Item>Fourth Item</Dropdown.Item>
    <Dropdown.Item>Fifth Item</Dropdown.Item>
  </Dropdown>
);

export const CustomTags = () => (
  <Dropdown label="Custom Dropdown Content">
    <Dropdown.Item as="a" href="https://example.com" target="_blank">
      Anchor Item
    </Dropdown.Item>
    <Dropdown.Item as="div">Div Item</Dropdown.Item>
  </Dropdown>
);

export const HoverableAndActive = () => (
  <Dropdown label="Hoverable + Active" hoverable active>
    <Dropdown.Item>Hover or Always Open</Dropdown.Item>
    <Dropdown.Item>Second</Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item>Another</Dropdown.Item>
  </Dropdown>
);

export const Right = () => (
  <Dropdown label="Dropdown Right" right ml="6">
    <Dropdown.Item>Right 1</Dropdown.Item>
    <Dropdown.Item>Right 2</Dropdown.Item>
  </Dropdown>
);

// Forwarded ref — the root `.dropdown` div, here measured on mount. The ref is
// merged with the internal one, so outside-click still closes the menu.
export const ForwardedRef = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    setWidth(dropdownRef.current?.getBoundingClientRect().width ?? null);
  }, []);

  return (
    <>
      <Dropdown ref={dropdownRef} label="Measured Dropdown" mb="3">
        <Dropdown.Item>First Item</Dropdown.Item>
        <Dropdown.Item>Second Item</Dropdown.Item>
      </Dropdown>
      <p>
        Root width from the forwarded ref:{' '}
        {width === null ? '—' : `${Math.round(width)}px`}
      </p>
    </>
  );
};

export const Up = () => (
  <>
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <Dropdown label="Dropdown Up" up>
      <Dropdown.Item>Up 1</Dropdown.Item>
      <Dropdown.Item>Up 2</Dropdown.Item>
    </Dropdown>
  </>
);

export const KeyboardAccessible = () => (
  <Dropdown label="Focus me, then press ArrowDown or Enter">
    <Dropdown.Item>First Item</Dropdown.Item>
    <Dropdown.Item>Second Item</Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item>Third Item</Dropdown.Item>
  </Dropdown>
);
KeyboardAccessible.parameters = {
  docs: {
    description: {
      story:
        'Implements the WAI-ARIA Menu Button pattern: ArrowDown/Enter/Space open the menu and focus the first item, ArrowUp opens and focuses the last item, ArrowDown/ArrowUp wrap between items, Home/End jump to the first/last item, and Escape closes the menu and returns focus to the trigger.',
    },
  },
};

export const CompoundUsage = () => (
  <Dropdown label="Compound Dropdown" active>
    <Dropdown.Item>First Item</Dropdown.Item>
    <Dropdown.Item>Second Item</Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item>Third Item</Dropdown.Item>
  </Dropdown>
);
