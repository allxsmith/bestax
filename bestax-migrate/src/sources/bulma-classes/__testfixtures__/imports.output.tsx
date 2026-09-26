// A licence header above the imports stays where it is.

import { useState } from 'react';
import { Box, Button as BulmaButton, Paragraph } from '@allxsmith/bestax-bulma';
import 'bulma/css/bulma.min.css';

function Button(props: { children: string }) {
  return <span>{props.children}</span>;
}

export function Imports() {
  const [on] = useState(true);
  return (
    <Box>
      <Box>Merged into the existing import</Box>
      <BulmaButton>Aliased past the local Button</BulmaButton>
      <Button>local</Button>
      {on && <Paragraph textColor="danger">Conditional</Paragraph>}
    </Box>
  );
}
