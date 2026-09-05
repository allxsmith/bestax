import React from "react";
import {
  Box,
  Button,
  Content,
  Delete,
  Icon,
  Image,
  Notification,
  Progress,
  Subtitle,
  Table,
  Tag,
  Title,
} from "bloomer";

export const Elements = () => (
  <Box>
    <Title isSize={1} isSpaced>
      Kitchen sink
    </Title>
    <Subtitle isSize={4} tag="h2">
      Every mapped element
    </Subtitle>
    <Content isSize="medium">
      <p>Body copy</p>
    </Content>
    <Button isColor="primary" isSize="small" isOutlined>
      One
    </Button>
    <Button isLink isInverted isStatic>
      Two
    </Button>
    <Button isLoading isFullWidth isActive isHovered isFocused>
      Three
    </Button>
    <Button href="/next" isColor="info">
      Next
    </Button>
    <Tag isColor="info" isSize="medium">
      tag
    </Tag>
    <Delete isSize="small" />
    <Notification isColor="warning">Careful</Notification>
    <Progress isColor="danger" value={40} max={100} isSize="medium" />
    <Icon className="fas fa-home" isSize="large" />
    <Icon className="mdi mdi-account" />
    <Icon className="fas fa-spinner fa-spin fa-lg" />
    <Image isSize="128x128" src="a.png" />
    <Image isRatio="16:9" src="b.png" />
    <Table isBordered isStriped isNarrow isFullWidth>
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Value</td>
        </tr>
      </tbody>
    </Table>
  </Box>
);
