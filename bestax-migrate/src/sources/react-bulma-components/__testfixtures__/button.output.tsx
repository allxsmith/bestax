import { Button, Buttons, Delete } from "@allxsmith/bestax-bulma";

export function Toolbar({ onClose }: { onClose: () => void }) {
  // TODO(bestax-migrate): `text` maps to `color="text"`, but `color` is already set on this element; reconcile by hand
  return (
    <Buttons hasAddons isRight>
      <Button color="link" isHovered isOutlined isRounded>
        Hover me
      </Button>
      <Button color="ghost" isStatic type="submit">
        Ghostly
      </Button>
      <Delete onClick={onClose} />
    </Buttons>
  );
}
