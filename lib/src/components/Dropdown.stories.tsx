import { Dropdown, DropdownItem, DropdownDivider } from './Dropdown';

export default {
  title: 'Components/Dropdown',
  component: Dropdown,
  subcomponents: { DropdownItem, DropdownDivider },
};

export const Default = () => (
  <Dropdown label="Dropdown Menu">
    <DropdownItem>First Item</DropdownItem>
    <DropdownItem>Second Item</DropdownItem>
    <DropdownDivider />
    <DropdownItem>Third Item</DropdownItem>
    <DropdownItem>Fourth Item</DropdownItem>
    <DropdownItem>Fifth Item</DropdownItem>
  </Dropdown>
);

export const CustomTags = () => (
  <Dropdown label="Custom Dropdown Content">
    <DropdownItem as="a" href="https://example.com" target="_blank">
      Anchor Item
    </DropdownItem>
    <DropdownItem as="div">Div Item</DropdownItem>
  </Dropdown>
);

export const HoverableAndActive = () => (
  <Dropdown label="Hoverable + Active" hoverable active>
    <DropdownItem>Hover or Always Open</DropdownItem>
    <DropdownItem>Second</DropdownItem>
    <DropdownDivider />
    <DropdownItem>Another</DropdownItem>
  </Dropdown>
);

export const Right = () => (
  <Dropdown label="Dropdown Right" right ml="6">
    <DropdownItem>Right 1</DropdownItem>
    <DropdownItem>Right 2</DropdownItem>
  </Dropdown>
);

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
      <DropdownItem>Up 1</DropdownItem>
      <DropdownItem>Up 2</DropdownItem>
    </Dropdown>
  </>
);
