import { render } from '@testing-library/react';
import type { ElementType, ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  CardImage,
  ContextMenu,
  DropdownDivider,
  DropdownItem,
  Figure,
  FigureCaption,
  ListItem,
  Message,
  MessageBody,
  MessageHeader,
  Modal,
  ModalBackground,
  ModalCard,
  ModalCardBody,
  ModalCardFoot,
  ModalCardHead,
  ModalCardTitle,
  ModalClose,
  ModalContent,
  OrderedList,
  Sidebar,
  SidebarBody,
  SidebarClose,
  SidebarFooter,
  SidebarHeader,
  SidebarTitle,
  UnorderedList,
} from '../index';

/**
 * A part a Server Component imports by name, beside the dotted form. `named`
 * and `dotted` are the same function. `selector` is what both render.
 */
type Part = {
  name: string;
  named: ElementType;
  dotted: ElementType;
  selector: string;
  children?: ReactNode;
};

const label = 'part';

const parts: Part[] = [
  {
    name: 'CardHeader',
    named: CardHeader,
    dotted: Card.Header,
    selector: '.card-header',
    children: label,
  },
  {
    name: 'CardHeaderTitle',
    named: CardHeaderTitle,
    dotted: Card.Header.Title,
    selector: '.card-header-title',
    children: label,
  },
  {
    name: 'CardHeaderIcon',
    named: CardHeaderIcon,
    dotted: Card.Header.Icon,
    selector: '.card-header-icon',
    children: label,
  },
  {
    name: 'CardImage',
    named: CardImage,
    dotted: Card.Image,
    selector: '.card-image',
    children: label,
  },
  {
    name: 'CardContent',
    named: CardContent,
    dotted: Card.Content,
    selector: '.card-content',
    children: label,
  },
  {
    name: 'CardFooter',
    named: CardFooter,
    dotted: Card.Footer,
    selector: '.card-footer',
    children: label,
  },
  {
    name: 'CardFooterItem',
    named: CardFooterItem,
    dotted: Card.FooterItem,
    selector: '.card-footer-item',
    children: label,
  },
  {
    name: 'ModalBackground',
    named: ModalBackground,
    dotted: Modal.Background,
    selector: '.modal-background',
  },
  {
    name: 'ModalContent',
    named: ModalContent,
    dotted: Modal.Content,
    selector: '.modal-content',
    children: label,
  },
  {
    name: 'ModalClose',
    named: ModalClose,
    dotted: Modal.Close,
    selector: '.delete',
  },
  {
    name: 'ModalCard',
    named: ModalCard,
    dotted: Modal.Card,
    selector: '.modal-card',
    children: label,
  },
  {
    name: 'ModalCardHead',
    named: ModalCardHead,
    dotted: Modal.Card.Head,
    selector: '.modal-card-head',
    children: label,
  },
  {
    name: 'ModalCardTitle',
    named: ModalCardTitle,
    dotted: Modal.Card.Title,
    selector: '.modal-card-title',
    children: label,
  },
  {
    name: 'ModalCardBody',
    named: ModalCardBody,
    dotted: Modal.Card.Body,
    selector: '.modal-card-body',
    children: label,
  },
  {
    name: 'ModalCardFoot',
    named: ModalCardFoot,
    dotted: Modal.Card.Foot,
    selector: '.modal-card-foot',
    children: label,
  },
  {
    name: 'SidebarHeader',
    named: SidebarHeader,
    dotted: Sidebar.Header,
    selector: '.sidebar-header',
    children: label,
  },
  {
    name: 'SidebarTitle',
    named: SidebarTitle,
    dotted: Sidebar.Title,
    selector: '.sidebar-title',
    children: label,
  },
  {
    name: 'SidebarClose',
    named: SidebarClose,
    dotted: Sidebar.Close,
    selector: '.sidebar-close',
  },
  {
    name: 'SidebarBody',
    named: SidebarBody,
    dotted: Sidebar.Body,
    selector: '.sidebar-body',
    children: label,
  },
  {
    name: 'SidebarFooter',
    named: SidebarFooter,
    dotted: Sidebar.Footer,
    selector: '.sidebar-footer',
    children: label,
  },
  {
    name: 'MessageHeader',
    named: MessageHeader,
    dotted: Message.Header,
    selector: '.message-header',
    children: label,
  },
  {
    name: 'MessageBody',
    named: MessageBody,
    dotted: Message.Body,
    selector: '.message-body',
    children: label,
  },
  {
    name: 'FigureCaption',
    named: FigureCaption,
    dotted: Figure.Caption,
    selector: 'figcaption',
    children: label,
  },
  {
    name: 'OrderedList.Item',
    named: ListItem,
    dotted: OrderedList.Item,
    selector: 'li',
    children: label,
  },
  {
    name: 'UnorderedList.Item',
    named: ListItem,
    dotted: UnorderedList.Item,
    selector: 'li',
    children: label,
  },
  {
    name: 'ContextMenu.Item',
    named: DropdownItem,
    dotted: ContextMenu.Item,
    selector: '.dropdown-item',
    children: label,
  },
  {
    name: 'ContextMenu.Divider',
    named: DropdownDivider,
    dotted: ContextMenu.Divider,
    selector: '.dropdown-divider',
  },
];

describe('named exports of compound parts', () => {
  it('types the nested card header parts on the named export', () => {
    expect(CardHeader.Title).toBe(Card.Header.Title);
    expect(CardHeader.Icon).toBe(Card.Header.Icon);
  });

  it.each(parts)(
    '$name is the dotted part, and both render',
    ({ named, dotted, selector, children }) => {
      expect(dotted).toBe(named);
      for (const Component of [named, dotted]) {
        const { unmount, container } = render(
          children === undefined ? (
            <Component />
          ) : (
            <Component>{children}</Component>
          )
        );
        expect(container.querySelector(selector)).toBeInTheDocument();
        unmount();
      }
    }
  );
});
