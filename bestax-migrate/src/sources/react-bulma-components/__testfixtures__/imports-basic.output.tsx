import { Button, Notification } from "@allxsmith/bestax-bulma";

export function Actions() {
  return (
    <div>
      <Button color="primary" size="large" as="a" isLoading isFullWidth>
        Save
      </Button>
      <Notification color="danger" isLight>
        Something went wrong
      </Notification>
    </div>
  );
}
