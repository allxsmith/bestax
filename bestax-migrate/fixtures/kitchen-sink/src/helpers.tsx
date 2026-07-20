import { Block, Box } from 'react-bulma-components';

export function Helpers() {
  return (
    <div>
      <Box
        textColor="primary"
        backgroundColor="dark"
        textSize={4}
        textAlign="center"
        textTransform="uppercase"
        textWeight="semibold"
        textFamily="monospace"
        m={3}
        px={2}
        pull="right"
        clipped
        radiusless
        shadowless
        unselectable
        clearfix
      >
        Kitchen sink of helpers
      </Box>
      <Block marginless italic hidden>
        Hidden italic block
      </Block>
      <Block
        display="flex"
        justifyContent="center"
        alignItems="center"
        mobile={{ display: 'flex', textSize: 5, textAlign: 'center' }}
        tablet={{ invisible: true }}
      >
        Flex and responsive
      </Block>
    </div>
  );
}
