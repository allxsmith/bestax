import { Button } from 'react-bulma-components';

export function Actions({ isRemove }: { isRemove: boolean }) {
  return (
    <div>
      <Button remove />
      <Button remove={false}>Save</Button>
      <Button remove="true">Save</Button>
      <Button remove="">Save</Button>
      <Button remove={0}>Save</Button>
      <Button remove={isRemove}>Save</Button>
    </div>
  );
}
