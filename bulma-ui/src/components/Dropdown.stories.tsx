import { Dropdown } from './Dropdown';

export default {
  title: 'Components/Dropdown',
  component: Dropdown,
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
