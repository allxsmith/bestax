import { Element, Tile, Box } from 'react-bulma-components';

export const Legacy = ({ align }: { align: 'left' | 'right' }) => (
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
  </div>
);
