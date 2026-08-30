import React from "react";
import {
  Block,
  Box,
  Button,
  Content,
  Delete,
  Loader,
  Notification,
  PageLoader,
  Progress,
  Table,
  Tag,
  Title,
} from "rbx";

export const Elements = () => (
  <Block>
    <Box>
      <Title size={1} spaced>
        Kitchen sink
      </Title>
      <Title subtitle size={4}>
        Every mapped element
      </Title>
      <Content size="medium">
        <p>Body copy</p>
      </Content>
      <Button.Group hasAddons align="centered">
        <Button color="primary" size="small" outlined>
          One
        </Button>
        <Button color="link" rounded inverted>
          Two
        </Button>
        <Button state="loading" fullwidth static>
          Three
        </Button>
      </Button.Group>
      <Tag.Group gapless>
        <Tag color="info" size="medium" rounded>
          tag
        </Tag>
        <Tag delete />
      </Tag.Group>
      <Delete size="small" />
      <Notification color="warning">Careful</Notification>
      <Progress color="danger" value={40} max={100} size="medium" />
      <Loader />
      <PageLoader active color="info" />
      <Table bordered striped narrow hoverable fullwidth>
        <Table.Head>
          <Table.Row>
            <Table.Heading>Name</Table.Heading>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Value</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Foot>
          <Table.Row>
            <Table.Cell>Total</Table.Cell>
          </Table.Row>
        </Table.Foot>
      </Table>
    </Box>
  </Block>
);
