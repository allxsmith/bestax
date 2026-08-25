import { Button, Delete } from "@allxsmith/bestax-bulma";

export function Actions({ isRemove }: { isRemove: boolean }) {
  // TODO(bestax-migrate): `remove` has a dynamic value; this can render as either a Button or a Delete cross — split the branch by hand
  return (
    <div>
      <Delete />
      <Button>Save</Button>
      <Button remove={isRemove}>Save</Button>
    </div>
  );
}
