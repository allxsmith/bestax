import { Button, Notification } from 'react-bulma-components';

export function Actions() {
  return (
    <div>
      <Button color="primary" size="large" loading fullwidth renderAs="a">
        Save
      </Button>
      <Notification color="danger" light>
        Something went wrong
      </Notification>
    </div>
  );
}
