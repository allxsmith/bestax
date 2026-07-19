import { Block, Box } from 'react-bulma-components';

export const Helpers = () => (
  <div>
    <Box
      textColor="primary"
      backgroundColor="dark"
      textSize={4}
      textAlign="center"
      textTransform="uppercase"
      textWeight="semibold"
      textFamily="monospace"
      italic
      m={3}
      px={2}
      pull="right"
      marginless
      clipped
      radiusless
      shadowless
      unselectable
      srOnly
      clearfix
    >
      Kitchen sink of helpers
    </Box>
    <Block
      display="flex"
      justifyContent="center"
      alignItems="center"
      mobile={{ display: 'flex', textSize: 5, textAlign: 'center' }}
      tablet={{ invisible: true }}
      touch={{ display: 'block' }}
    >
      Flex and responsive
    </Block>
  </div>
);
