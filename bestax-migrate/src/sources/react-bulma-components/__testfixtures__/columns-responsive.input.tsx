import { Columns } from 'react-bulma-components';

export const Layout = () => (
  <Columns breakpoint="mobile" gap={4} multiline centered vCentered>
    <Columns.Column size="half" offset="one-quarter" narrow>
      Main
    </Columns.Column>
    <Columns.Column
      mobile={{ size: 12 }}
      tablet={{ size: 6, narrow: true }}
      desktop={{ size: 4, offset: 2 }}
      touch={{ size: 10 }}
    >
      Side
    </Columns.Column>
  </Columns>
);
