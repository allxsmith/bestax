import React from "react";
import { Box, Button, Notification, Progress, Subtitle, Tag, Title } from "bloomer";
import "bulma/css/bulma.css";

export const Basic = () => (
  <Box>
    <Title isSize={2} isSpaced>
      Heading
    </Title>
    <Subtitle isSize={4} tag="h3">
      Sub
    </Subtitle>
    <Button isColor="primary" isSize="medium" isOutlined>
      Go
    </Button>
    <Button isLink isLoading isFullWidth>
      Wait
    </Button>
    <Button href="/next" isInverted>
      Next
    </Button>
    <Tag isColor="danger" isSize="medium">
      New
    </Tag>
    <Notification isColor="warning">Careful</Notification>
    <Progress isColor="info" value={30} max={100} isSize="small" />
  </Box>
);
