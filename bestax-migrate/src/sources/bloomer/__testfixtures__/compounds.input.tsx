import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  CardImage,
  Hero,
  HeroBody,
  HeroFooter,
  HeroHeader,
  Level,
  LevelItem,
  LevelLeft,
  LevelRight,
  Media,
  MediaContent,
  MediaLeft,
  MediaRight,
  Menu,
  MenuLabel,
  MenuLink,
  MenuList,
  Message,
  MessageBody,
  MessageHeader,
  Modal,
  ModalBackground,
  ModalCard,
  ModalCardBody,
  ModalCardFooter,
  ModalCardHeader,
  ModalCardTitle,
  ModalClose,
  Navbar,
  NavbarBrand,
  NavbarBurger,
  NavbarDivider,
  NavbarDropdown,
  NavbarEnd,
  NavbarItem,
  NavbarLink,
  NavbarMenu,
  NavbarStart,
} from "bloomer";

export const Compounds = ({ open }: { open: boolean }) => (
  <>
    <Card>
      <CardHeader>
        <CardHeaderTitle>Title</CardHeaderTitle>
        <CardHeaderIcon>
          <span>?</span>
        </CardHeaderIcon>
      </CardHeader>
      <CardImage>
        <img src="a.png" alt="" />
      </CardImage>
      <CardContent>Body</CardContent>
      <CardFooter>
        <CardFooterItem>Save</CardFooterItem>
      </CardFooter>
    </Card>
    <Hero isColor="primary" isSize="medium">
      <HeroHeader>Head</HeroHeader>
      <HeroBody>Body</HeroBody>
      <HeroFooter>Foot</HeroFooter>
    </Hero>
    <Hero isFullHeight isColor="dark">
      <HeroBody>Tall</HeroBody>
    </Hero>
    <Level isMobile>
      <LevelLeft>
        <LevelItem>Left</LevelItem>
      </LevelLeft>
      <LevelRight>
        <LevelItem href="/all" tag="span">
          All
        </LevelItem>
      </LevelRight>
    </Level>
    <Media tag="div">
      <MediaLeft tag="figure">img</MediaLeft>
      <MediaContent>text</MediaContent>
      <MediaRight>x</MediaRight>
    </Media>
    <Menu>
      <MenuLabel>General</MenuLabel>
      <MenuList>
        <MenuLink isActive href="/">
          Dashboard
        </MenuLink>
      </MenuList>
    </Menu>
    <Message isColor="info">
      <MessageHeader>Hello</MessageHeader>
      <MessageBody>World</MessageBody>
    </Message>
    <Modal isActive={open}>
      <ModalBackground />
      <ModalCard>
        <ModalCardHeader>
          <ModalCardTitle>Modal title</ModalCardTitle>
        </ModalCardHeader>
        <ModalCardBody>Content</ModalCardBody>
        <ModalCardFooter>Footer</ModalCardFooter>
      </ModalCard>
      <ModalClose isSize="large" />
    </Modal>
    <Navbar isTransparent>
      <NavbarBrand>
        <NavbarItem href="/">Logo</NavbarItem>
        <NavbarBurger isActive={open} />
      </NavbarBrand>
      <NavbarMenu isActive={open}>
        <NavbarStart>
          <NavbarItem isActive>Home</NavbarItem>
          <NavbarItem hasDropdown isHoverable>
            <NavbarLink>More</NavbarLink>
            <NavbarDropdown>
              <NavbarItem href="/about">About</NavbarItem>
              <NavbarDivider />
              <NavbarItem>Jobs</NavbarItem>
            </NavbarDropdown>
          </NavbarItem>
        </NavbarStart>
        <NavbarEnd>
          <NavbarItem tag="div">
            <Button>Log in</Button>
          </NavbarItem>
        </NavbarEnd>
      </NavbarMenu>
    </Navbar>
  </>
);

import { Button } from "bloomer";
