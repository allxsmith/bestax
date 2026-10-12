import { Element, Tile, Box, Button, Message } from 'react-bulma-components';

export const Legacy = ({
  align,
  size,
}: {
  align: 'left' | 'right';
  size: string;
}) => (
  <div>
    <Element renderAs="span" textColor="grey">
      Generic element
    </Element>
    <Tile kind="ancestor">
      <Tile kind="parent" vertical size={8}>
        <Tile kind="child">Tile child</Tile>
      </Tile>
    </Tile>
    <Box colorVariant="light" pull={align} textSize={2}>
      Dynamic and unmappable props
    </Box>
    <Button.Group size="normal">
      <Button>Not a Buttons size</Button>
    </Button.Group>
    <Message size={size}>
      <Message.Body>A size the codemod cannot read</Message.Body>
    </Message>
  </div>
);
