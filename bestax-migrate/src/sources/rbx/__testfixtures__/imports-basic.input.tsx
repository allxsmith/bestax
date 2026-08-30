import React from "react";
import { Block, Box, Button, Notification, Progress, Tag, Title } from "rbx";
import "rbx/index.css";

export const Basic = () => (
  <Block>
    <Box>
      <Title size={2} spaced>
        Heading
      </Title>
      <Title subtitle size={4}>
        Sub
      </Title>
      <Button color="primary" size="medium" outlined rounded>
        Go
      </Button>
      <Button state="loading" fullwidth>
        Wait
      </Button>
      <Tag color="danger" rounded size="medium">
        New
      </Tag>
      <Tag.Group gapless>
        <Tag>a</Tag>
        <Tag>b</Tag>
      </Tag.Group>
      <Notification color="warning">Careful</Notification>
      <Progress color="info" value={30} max={100} size="small" />
    </Box>
  </Block>
);
