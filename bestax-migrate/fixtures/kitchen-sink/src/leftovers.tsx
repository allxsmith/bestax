/**
 * Everything in this file is EXPECTED to need hand-migration: the codemod
 * leaves TODO(bestax-migrate) comments here instead of converting. The e2e
 * test asserts these TODOs are produced and excludes this file from the
 * migrated-output typecheck.
 */

import { useState } from 'react';
import {
  Block,
  Button,
  Card,
  Dropdown,
  Element,
  Hero,
  Modal,
  Pagination,
  Tile,
} from 'react-bulma-components';

export function Leftovers() {
  const [choice, setChoice] = useState('a');
  const [page, setPage] = useState(1);
  return (
    <div>
      <Element renderAs="span" textColor="grey">
        Generic element
      </Element>
      <Tile kind="ancestor">
        <Tile kind="parent" vertical size={8}>
          <Tile kind="child">Tile child</Tile>
        </Tile>
      </Tile>
      <Hero size="halfheight" gradient>
        <Hero.Body>Half height with gradient</Hero.Body>
      </Hero>
      <Button color="grey-light" isSelected colorVariant="light">
        Shade color
      </Button>
      <Block touch={{ display: 'block' }} untilWidescreen={{ textSize: 5 }} renderAs="section">
        Touch-only helpers
      </Block>
      <Card.Footer>
        <Card.Footer.Item renderAs="a" href="#save">
          Save
        </Card.Footer.Item>
      </Card.Footer>
      <Modal show closeOnEsc={false} closeOnBlur showClose={false} onClose={() => {}}>
        <Modal.Content>Raw content</Modal.Content>
      </Modal>
      <Dropdown value={choice} onChange={setChoice} label="Pick">
        <Dropdown.Item value="a">First</Dropdown.Item>
        <Dropdown.Item value="b">Second</Dropdown.Item>
      </Dropdown>
      <Pagination
        current={page}
        total={20}
        onChange={setPage}
        delta={2}
        showFirstLast
        autoHide
      />
    </div>
  );
}
