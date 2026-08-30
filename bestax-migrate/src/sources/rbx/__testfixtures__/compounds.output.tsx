import React from "react";
import { Breadcrumb, Card, Hero, Level, Media, Message, Table } from "@allxsmith/bestax-bulma";

export const Compounds = () => (
  <>
    <Card>
      <Card.Header>
        <Card.Header.Title isCentered>Title</Card.Header.Title>
        <Card.Header.Icon>i</Card.Header.Icon>
      </Card.Header>
      <Card.Content>body</Card.Content>
      <Card.Footer>
        <Card.FooterItem>one</Card.FooterItem>
      </Card.Footer>
    </Card>
    <Level isMobile>
      <Level.Left>left</Level.Left>
      <Level.Right>right</Level.Right>
      <Level.Item>middle</Level.Item>
    </Level>
    <Media>
      <Media.Left>avatar</Media.Left>
      <Media.Content>body</Media.Content>
    </Media>
    <Message color="info">
      <Message.Header>head</Message.Header>
      <Message.Body>body</Message.Body>
    </Message>
    <Table isBordered isStriped isHoverable isFullwidth isNarrow>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>h</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td>c</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
    <Hero color="primary" size="large">
      <Hero.Head>head</Hero.Head>
      <Hero.Body>body</Hero.Body>
      <Hero.Foot>foot</Hero.Foot>
    </Hero>
    <Breadcrumb alignment="centered" separator="arrow">
      <li><a href="/a">A</a></li>
      <li className="is-active"><a href="/b">B</a></li>
    </Breadcrumb>
  </>
);
