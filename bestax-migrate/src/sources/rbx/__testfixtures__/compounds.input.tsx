import React from "react";
import { Card, Level, Media, Message, Table, Hero, Breadcrumb } from "rbx";

export const Compounds = () => (
  <>
    <Card>
      <Card.Header>
        <Card.Header.Title align="centered">Title</Card.Header.Title>
        <Card.Header.Icon>i</Card.Header.Icon>
      </Card.Header>
      <Card.Content>body</Card.Content>
      <Card.Footer>
        <Card.Footer.Item>one</Card.Footer.Item>
      </Card.Footer>
    </Card>
    <Level breakpoint="mobile">
      <Level.Item align="left">left</Level.Item>
      <Level.Item align="right">right</Level.Item>
      <Level.Item>middle</Level.Item>
    </Level>
    <Media>
      <Media.Item align="left">avatar</Media.Item>
      <Media.Item align="content">body</Media.Item>
    </Media>
    <Message color="info">
      <Message.Header>head</Message.Header>
      <Message.Body>body</Message.Body>
    </Message>
    <Table bordered striped hoverable fullwidth narrow>
      <Table.Head>
        <Table.Row>
          <Table.Heading>h</Table.Heading>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell>c</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
    <Hero color="primary" size="large">
      <Hero.Head>head</Hero.Head>
      <Hero.Body>body</Hero.Body>
      <Hero.Foot>foot</Hero.Foot>
    </Hero>
    <Breadcrumb align="centered" separator="arrow">
      <Breadcrumb.Item href="/a">A</Breadcrumb.Item>
      <Breadcrumb.Item active href="/b">B</Breadcrumb.Item>
    </Breadcrumb>
  </>
);
