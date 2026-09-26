import clsx from 'clsx';
import { Button, Buttons, Notification } from "@allxsmith/bestax-bulma";

export function Toolbar() {
  const busy = true;
  const quiet = false;
  // TODO(bestax-migrate): this `className` is computed, and the codemod reads only a `clsx` or `classnames` call of class strings and conditional classes; convert this element to bestax `Box` by hand, turning each condition into its prop
  return (
    <Buttons hasAddons={quiet}>
      <Button color="primary" isLoading={busy}>
        Save
      </Button>
      <Button isOutlined={!quiet} className="my-btn">
        Cancel
      </Button>
      <Notification isLight={busy} className={clsx(quiet && 'my-quiet')}>
        Saving
      </Notification>
      <div className={clsx('box', busy ? 'mt-2' : 'mt-4')}>Either margin</div>
    </Buttons>
  );
}
