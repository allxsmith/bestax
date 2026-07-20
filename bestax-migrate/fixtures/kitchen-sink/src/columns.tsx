import { Columns } from 'react-bulma-components';

export function Grid() {
  return (
    <Columns breakpoint="mobile" gap={4} multiline centered vCentered>
      <Columns.Column size="half" offset="one-quarter">
        Main content
      </Columns.Column>
      <Columns.Column narrow>Sidebar</Columns.Column>
      <Columns.Column
        mobile={{ size: 12 }}
        tablet={{ size: 6, narrow: true }}
        desktop={{ size: 4, offset: 2 }}
        widescreen={{ size: 3 }}
        fullhd={{ size: 2 }}
      >
        Responsive column
      </Columns.Column>
    </Columns>
  );
}
