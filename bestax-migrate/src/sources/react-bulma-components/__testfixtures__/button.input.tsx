import { Button } from 'react-bulma-components';

export function Toolbar({ onClose }: { onClose: () => void }) {
  return (
    <Button.Group align="right" hasAddons>
      <Button color="link" state="hover" outlined rounded>
        Hover me
      </Button>
      <Button color="ghost" text submit isStatic>
        Ghostly
      </Button>
      <Button remove onClick={onClose} />
    </Button.Group>
  );
}
