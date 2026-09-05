import React from "react";
import { Container, Content, Delete, Footer, Icon, Image, Table } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): kept the Font Awesome 4 classes on an <i> child, as bloomer rendered them; bestax's optional Font Awesome peer is 6.7+, where many v4 names changed (brand icons moved to `variant="brands"`) — keep FA4 loaded, or switch to `name`/`library`/`variant` (`<Icon name="home" library="fa" variant="solid" />`)
// TODO(bestax-migrate): kept the icon classes on an <i> child, as bloomer rendered them; bestax renders that child unchanged, so make sure the icon font is still loaded — or switch to `name`/`library`/`variant` (`<Icon name="home" library="fa" variant="solid" />`)
// TODO(bestax-migrate): no icon classes to carry over (bloomer read them from `className`); bestax `Icon` needs a `name` (plus `library`/`variant`) or a child node
// TODO(bestax-migrate): both `isSize` and `isRatio` were set; bestax `Image` has one `size` prop for either, and Bulma applies only one of the two classes — kept the fixed size, restore the ratio by hand if that is the one you wanted
export const Media = ({ cls }: { cls: string }) => (
  <Container>
    <Icon size="large" name="home" library="fa" variant="solid" />
    <Icon name="account" library="mdi" />
    <Icon textColor="danger"><i className="fa fa-github" aria-hidden="true" /></Icon>
    <Icon className="is-right"><i className={cls} aria-hidden="true" /></Icon>
    <Icon size="small" />
    <Image size="128x128" src="a.png" />
    <Image size="16by9" src="b.png" />
    <Image size="64x64" src="c.png" />
    <Content size="small">
      <p>Prose</p>
    </Content>
    <Delete size="medium" />
    <Table isBordered isStriped isNarrow isFullWidth>
      <tbody>
        <tr>
          <td>1</td>
        </tr>
      </tbody>
    </Table>
    <Footer as="div">Bye</Footer>
  </Container>
);
