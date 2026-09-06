import React from "react";
import { Box, Button, Notification, Progress, SubTitle, Tag, Title } from "@allxsmith/bestax-bulma";
import "@allxsmith/bestax-bulma/bestax.css";

export const Basic = () => (
  <Box>
    <Title size={2} isSpaced>
      Heading
    </Title>
    <SubTitle size={4} as="h3">
      Sub
    </SubTitle>
    <Button color="primary" size="medium" isOutlined>
      Go
    </Button>
    <Button isLoading isFullWidth color="link">
      Wait
    </Button>
    <Button href="/next" isInverted as="a">
      Next
    </Button>
    <Tag color="danger" size="medium">
      New
    </Tag>
    <Notification color="warning">Careful</Notification>
    <Progress color="info" value={30} max={100} size="small" />
  </Box>
);
