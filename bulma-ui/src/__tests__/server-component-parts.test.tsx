/**
 * A client component written in a React Server Component reaches the client
 * with a lazy element type rather than its own function (#1500). A parent that
 * tells its parts apart by comparing `child.type` laid them out wrong there.
 * Each case below renders once with its components as they are and once with
 * every component behind a loaded lazy type, the shape a Server Component
 * sends, and the two must render the same markup.
 *
 * A real Server Components render needs a bundler, which these tests don't
 * have, but the lazy type is the one React's renderer reads in both places.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AppFrame,
  AppFrameHeader,
  AppFrameMain,
  AppFrameNav,
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  CardImage,
  Field,
  FieldBody,
  FieldLabel,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuItem,
  MenuList,
  Modal,
  ModalBackground,
  ModalCard,
  ModalCardBody,
  ModalCardFoot,
  ModalCardHead,
  ModalCardTitle,
  ModalClose,
  ModalContent,
  Splitter,
  SplitterPane,
  Stat,
  StatLabel,
  StatValue,
  Tab,
  TabContentItem,
  TabList,
  Tabs,
  TabsContent,
} from '../index';
import { resetDevWarnings } from '../helpers/devWarnings';

/** A component behind a lazy type whose module has loaded. */
function lazy<T>(component: T): T {
  return {
    $$typeof: Symbol.for('react.lazy'),
    _payload: component,
    _init: (payload: T) => payload,
  } as unknown as T;
}

type Wrap = <T>(component: T) => T;

const asIs: Wrap = component => component;

/** Each case, written against `w`, which wraps every component it renders. */
const cases: Record<string, (w: Wrap) => React.ReactElement> = {
  'Card built from its parts': w => {
    const [C, H, T, I, Img, Body, Foot, Item] = [
      Card,
      CardHeader,
      CardHeaderTitle,
      CardHeaderIcon,
      CardImage,
      CardContent,
      CardFooter,
      CardFooterItem,
    ].map(w) as [
      typeof Card,
      typeof CardHeader,
      typeof CardHeaderTitle,
      typeof CardHeaderIcon,
      typeof CardImage,
      typeof CardContent,
      typeof CardFooter,
      typeof CardFooterItem,
    ];
    return (
      <C>
        <H>
          <T>Title</T>
          <I>
            <span>i</span>
          </I>
        </H>
        <Img>
          <img src="/a.png" alt="" />
        </Img>
        <Body>Body</Body>
        <Foot>
          <Item>One</Item>
        </Foot>
      </C>
    );
  },
  'Card.Header holding text': w => {
    const [C, H, Body] = [Card, CardHeader, CardContent].map(w) as [
      typeof Card,
      typeof CardHeader,
      typeof CardContent,
    ];
    return (
      <C>
        <H>Title</H>
        <Body>Body</Body>
      </C>
    );
  },
  'Card holding only a header icon': w => {
    const [C, I] = [Card, CardHeaderIcon].map(w) as [
      typeof Card,
      typeof CardHeaderIcon,
    ];
    return (
      <C>
        <I>
          <span>i</span>
        </I>
      </C>
    );
  },
  'Modal with its content parts': w => {
    const [M, Bg, Content, Close] = [
      Modal,
      ModalBackground,
      ModalContent,
      ModalClose,
    ].map(w) as [
      typeof Modal,
      typeof ModalBackground,
      typeof ModalContent,
      typeof ModalClose,
    ];
    return (
      <M active portal={false} aria-label="Demo">
        <Bg />
        <Content>Inside</Content>
        <Close aria-label="Close" />
      </M>
    );
  },
  'Modal with a card': w => {
    const [M, Bg, MC, Head, Title, Body, Foot] = [
      Modal,
      ModalBackground,
      ModalCard,
      ModalCardHead,
      ModalCardTitle,
      ModalCardBody,
      ModalCardFoot,
    ].map(w) as [
      typeof Modal,
      typeof ModalBackground,
      typeof ModalCard,
      typeof ModalCardHead,
      typeof ModalCardTitle,
      typeof ModalCardBody,
      typeof ModalCardFoot,
    ];
    return (
      <M active portal={false} aria-label="Demo">
        <Bg />
        <MC>
          <Head>
            <Title>Title</Title>
          </Head>
          <Body>Body</Body>
          <Foot>Foot</Foot>
        </MC>
      </M>
    );
  },
  'Menu.Item holding a nested Menu.List': w => {
    const [Mn, List, Item] = [Menu, MenuList, MenuItem].map(w) as [
      typeof Menu,
      typeof MenuList,
      typeof MenuItem,
    ];
    return (
      <Mn>
        <List>
          <Item href="#parent">
            Parent
            <List>
              <Item href="#child">Child</Item>
            </List>
          </Item>
        </List>
      </Mn>
    );
  },
  'Tabs with Tabs.Content': w => {
    const [T, List, One, Content, Panel] = [
      Tabs,
      TabList,
      Tab,
      TabsContent,
      TabContentItem,
    ].map(w) as [
      typeof Tabs,
      typeof TabList,
      typeof Tab,
      typeof TabsContent,
      typeof TabContentItem,
    ];
    return (
      <T>
        <List>
          <One index={0}>One</One>
          <One index={1}>Two</One>
        </List>
        <Content>
          <Panel index={0}>Panel one</Panel>
          <Panel index={1}>Panel two</Panel>
        </Content>
      </T>
    );
  },
  'vertical Tabs with Tabs.Content': w => {
    const [T, List, One, Content, Panel] = [
      Tabs,
      TabList,
      Tab,
      TabsContent,
      TabContentItem,
    ].map(w) as [
      typeof Tabs,
      typeof TabList,
      typeof Tab,
      typeof TabsContent,
      typeof TabContentItem,
    ];
    return (
      <T vertical side="right">
        <List>
          <One index={0}>One</One>
        </List>
        <Content>
          <Panel index={0}>Panel one</Panel>
        </Content>
      </T>
    );
  },
  'horizontal Field with Field.Label and Field.Body': w => {
    const [F, Label, Body, In] = [Field, FieldLabel, FieldBody, Input].map(
      w
    ) as [typeof Field, typeof FieldLabel, typeof FieldBody, typeof Input];
    return (
      <F horizontal>
        <Label>
          <label htmlFor="name">Name</label>
        </Label>
        <Body>
          <In id="name" />
        </Body>
      </F>
    );
  },
  'Stat built from its parts': w => {
    const [S, Label, Value] = [Stat, StatLabel, StatValue].map(w) as [
      typeof Stat,
      typeof StatLabel,
      typeof StatValue,
    ];
    return (
      <S>
        <Label>Revenue</Label>
        <Value>12</Value>
      </S>
    );
  },
  Splitter: w => {
    const [Sp, Pane] = [Splitter, SplitterPane].map(w) as [
      typeof Splitter,
      typeof SplitterPane,
    ];
    return (
      <Sp aria-label="Panes">
        <Pane label="Files" defaultSize={30}>
          A
        </Pane>
        <Pane label="Editor">B</Pane>
      </Sp>
    );
  },
  'AppFrame whose main and nav have ids of their own': w => {
    const [Frame, Header, Nav, Main] = [
      AppFrame,
      AppFrameHeader,
      AppFrameNav,
      AppFrameMain,
    ].map(w) as [
      typeof AppFrame,
      typeof AppFrameHeader,
      typeof AppFrameNav,
      typeof AppFrameMain,
    ];
    return (
      <Frame>
        <Header>Head</Header>
        <Nav id="my-nav">Nav</Nav>
        <Main id="my-main">Main</Main>
      </Frame>
    );
  },
  'IconButton with an Icon child': w => {
    const [B, I] = [IconButton, Icon].map(w) as [
      typeof IconButton,
      typeof Icon,
    ];
    return (
      <B aria-label="Star">
        <I name="star" />
      </B>
    );
  },
};

/** React's generated ids differ from one client root to the next. */
const withoutIds = (html: string) =>
  html.replace(/«[^»]*»|_r_[0-9a-z]+_|:r[0-9a-z]+:/g, 'ID');

describe('parts written in a Server Component (#1500)', () => {
  it.each(Object.keys(cases))('%s renders the same on the server', name => {
    expect(renderToStaticMarkup(cases[name](lazy))).toBe(
      renderToStaticMarkup(cases[name](asIs))
    );
  });

  it.each(Object.keys(cases))('%s renders the same on the client', name => {
    const expected = render(cases[name](asIs)).container.innerHTML;
    const actual = render(cases[name](lazy)).container.innerHTML;
    expect(withoutIds(actual)).toBe(withoutIds(expected));
  });

  it("finds a Stat's label part, so it doesn't warn", () => {
    resetDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(cases['Stat built from its parts'](lazy));
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
