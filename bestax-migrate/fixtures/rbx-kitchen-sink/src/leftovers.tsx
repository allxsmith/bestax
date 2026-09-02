// Everything the rbx codemod intentionally refuses to convert. This file is
// EXCLUDED from the e2e's typecheck of the migrated output — a `todo`
// PropAction deliberately leaves the original attribute in place next to its
// TODO comment, so the result is not expected to compile. The e2e asserts the
// TODO rules instead.
import React from "react";
import {
  Divider,
  Dropdown,
  Fieldset,
  File,
  Generic,
  Highlight,
  Icon,
  List,
  Modal,
  Numeric,
  Tile,
} from "rbx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

export const Leftovers = ({ where }: { where: "left" | "right" }) => (
  <Generic as="section">
    {/* Bulma v1 removed tiles outright. */}
    <Tile kind="ancestor">
      <Tile kind="parent" vertical size={4}>
        <Tile kind="child">tile</Tile>
      </Tile>
    </Tile>

    {/* the bulma-list extension, which Bulma v1 does not ship */}
    <List>
      <List.Item active>item</List.Item>
    </List>

    {/* no bestax equivalents */}
    <Fieldset disabled>fields</Fieldset>
    <Numeric>{1000}</Numeric>
    <Highlight>{"const a = 1;"}</Highlight>

    {/* bestax's Icon needs a required `name`, unreadable from a component child */}
    <Icon size="small">
      <FontAwesomeIcon icon={faHome} />
    </Icon>

    {/* bestax's File renders this whole structure from its own props */}
    <File hasName>
      <File.Label>
        <File.Input name="upload" />
        <File.CTA>
          <File.Icon>
            <FontAwesomeIcon icon={faHome} />
          </File.Icon>
          <File.Label>Choose…</File.Label>
        </File.CTA>
        <File.Name>none</File.Name>
      </File.Label>
    </File>

    {/* bestax's Dropdown takes a `label` and renders its own trigger */}
    <Dropdown managed>
      <Dropdown.Trigger>Open</Dropdown.Trigger>
      <Dropdown.Menu>
        <Dropdown.Content>
          <Dropdown.Item active>one</Dropdown.Item>
          <Dropdown.Divider />
        </Dropdown.Content>
      </Dropdown.Menu>
    </Dropdown>

    {/* bestax's Modal has no Escape handling, portal, or scroll lock; every conversion is flagged */}
    <Modal active closeOnEsc closeOnBlur>
      <Modal.Content>body</Modal.Content>
    </Modal>

    {/* rbx rendered the children as a label; bestax's Divider is a void <hr> */}
    <Divider>OR</Divider>

    {/* dynamic values are never best-guessed */}
    <Generic as="div" textAlign={where === "left" ? "left" : "right"} />
  </Generic>
);
