import React from "react";
import { Breadcrumb, Dropdown, Pagination, Panel, Tabs } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): kept the Font Awesome 4 classes on an <i> child, as bloomer rendered them; bestax's optional Font Awesome peer is 6.7+, where many v4 names changed (brand icons moved to `variant="brands"`) — keep FA4 loaded, or switch to `name`/`library`/`variant` (`<Icon name="home" library="fa" variant="solid" />`)
// TODO(bestax-migrate): bestax `Dropdown` takes a `label` and renders its own trigger and menu; move the `<DropdownTrigger>` content into `label`, keep the `<DropdownItem>`s as direct children, and drop the `DropdownMenu`/`DropdownContent` wrappers
export const Navigation = ({ onSelect }: { onSelect: () => void }) => (
  <>
    <Breadcrumb alignment="centered" separator="arrow" size="small">
      <li>
        <a href="/">Home</a>
      </li>
      <li className="is-active">
        <a href="/here">Here</a>
      </li>
    </Breadcrumb>
    <Tabs align="centered" boxed size="small" isFullWidth>
      <Tabs.List>
        <Tabs.Item active>
          <a href="#one">One</a>
        </Tabs.Item>
        <Tabs.Item>
          <a onClick={onSelect}>Two</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
    <Pagination size="medium">
      <Pagination.Previous>Previous</Pagination.Previous>
      <Pagination.Next href="/p2">
        Next
      </Pagination.Next>
      <Pagination.List>
        <Pagination.Link>1</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link active href="/p46" className="mine">
          46
        </Pagination.Link>
      </Pagination.List>
    </Pagination>
    <Panel>
      <Panel.Heading>Repositories</Panel.Heading>
      <Panel.Tabs>
        <a className="is-active">All</a>
        <a>Public</a>
      </Panel.Tabs>
      <Panel.Block active href="/repo">
        <Panel.Icon name="book" library="fa" variant="solid" />
        bestax
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon><i className="fa fa-code-fork" aria-hidden="true" /></Panel.Icon>
        fork
      </Panel.Block>
    </Panel>
    <Dropdown active hoverable right>
      <Dropdown.Item active href="/a">
        A
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item as="div">B</Dropdown.Item>
    </Dropdown>
  </>
);
