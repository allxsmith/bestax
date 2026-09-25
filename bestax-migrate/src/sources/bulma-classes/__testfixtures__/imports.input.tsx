// A licence header above the imports stays where it is.

import { useState } from 'react';
import { Box } from '@allxsmith/bestax-bulma';
import 'bulma/css/bulma.min.css';

function Button(props: { children: string }) {
  return <span>{props.children}</span>;
}

export function Imports() {
  const [on] = useState(true);
  return (
    <Box>
      <div className="box">Merged into the existing import</div>
      <button className="button">Aliased past the local Button</button>
      <Button>local</Button>
      {on && <p className="has-text-danger">Conditional</p>}
    </Box>
  );
}
