import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  CardImage,
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
  ModalContent,
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
  Page,
  PageControl,
  PageEllipsis,
  PageLink,
  PageList,
  Pagination,
  Panel,
  PanelBlock,
  PanelHeading,
  PanelIcon,
  PanelTab,
  PanelTabs,
  Tab,
  TabLink,
  TabList,
  Tabs,
} from "bloomer";

export const Components = ({ open }: { open: boolean }) => (
  <>
    <Breadcrumb isAlign="centered" hasSeparator="arrow" isSize="small">
      <ul>
        <BreadcrumbItem>
          <a href="/">Home</a>
        </BreadcrumbItem>
        <BreadcrumbItem isActive>
          <a href="/here">Here</a>
        </BreadcrumbItem>
      </ul>
    </Breadcrumb>
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
    <Level isMobile>
      <LevelLeft>
        <LevelItem>Left</LevelItem>
      </LevelLeft>
      <LevelRight>
        <LevelItem href="/all">All</LevelItem>
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
        <li>
          <MenuLink isActive href="/">
            Dashboard
          </MenuLink>
        </li>
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
    <Modal isActive>
      <ModalBackground />
      <ModalContent>Plain</ModalContent>
    </Modal>
    <Navbar isTransparent>
      <NavbarBrand>
        <NavbarItem href="/">Logo</NavbarItem>
        <NavbarBurger isActive={open} />
      </NavbarBrand>
      <NavbarMenu isActive={open}>
        <NavbarStart>
          <NavbarItem isActive>Home</NavbarItem>
          <NavbarItem href="/docs" isActive>
            Docs
          </NavbarItem>
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
            <span>Log in</span>
          </NavbarItem>
        </NavbarEnd>
      </NavbarMenu>
    </Navbar>
    <Pagination isAlign="right" isSize="medium">
      <PageControl>Previous</PageControl>
      <PageControl isNext href="/p2">
        Next
      </PageControl>
      <PageList>
        <Page>
          <PageLink>1</PageLink>
        </Page>
        <Page>
          <PageEllipsis />
        </Page>
        <Page>
          <PageLink isCurrent href="/p46">
            46
          </PageLink>
        </Page>
      </PageList>
    </Pagination>
    <Panel>
      <PanelHeading>Repositories</PanelHeading>
      <PanelTabs>
        <PanelTab isActive>All</PanelTab>
        <PanelTab>Public</PanelTab>
      </PanelTabs>
      <PanelBlock isActive href="/repo">
        <PanelIcon className="fas fa-book" />
        bestax
      </PanelBlock>
      <PanelBlock>
        <PanelIcon className="fas fa-code-branch" />
        fork
      </PanelBlock>
    </Panel>
    <Tabs isAlign="centered" isBoxed isSize="small" isFullWidth>
      <TabList>
        <Tab isActive>
          <TabLink href="#one">One</TabLink>
        </Tab>
        <Tab>
          <TabLink>Two</TabLink>
        </Tab>
      </TabList>
    </Tabs>
  </>
);
