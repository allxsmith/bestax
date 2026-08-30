import React from "react";
import { Block, Box, Button, Notification, Progress, SubTitle, Tag, Tags, Title } from "@allxsmith/bestax-bulma";
import "@allxsmith/bestax-bulma/bestax.css";

export const Basic = () => (
  <Block>
    <Box>
      <Title size={2} isSpaced>
        Heading
      </Title>
      <SubTitle size={4}>
        Sub
      </SubTitle>
      <Button color="primary" size="medium" isOutlined isRounded>
        Go
      </Button>
      <Button isLoading isFullwidth>
        Wait
      </Button>
      <Tag color="danger" size="medium" isRounded>
        New
      </Tag>
      <Tags hasAddons>
        <Tag>a</Tag>
        <Tag>b</Tag>
      </Tags>
      <Notification color="warning">Careful</Notification>
      <Progress color="info" value={30} max={100} size="small" />
    </Box>
  </Block>
);
