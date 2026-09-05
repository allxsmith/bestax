import React from "react";
import { Icon, Image, Content, Delete, Table, Footer, Container } from "bloomer";

export const Media = ({ cls }: { cls: string }) => (
  <Container>
    <Icon className="fas fa-home" isSize="large" />
    <Icon className="mdi mdi-account" />
    <Icon className="fa fa-github" hasTextColor="danger" />
    <Icon className={cls} isAlign="right" />
    <Icon isSize="small" />
    <Image isSize="128x128" src="a.png" />
    <Image isRatio="16:9" src="b.png" />
    <Image isSize="64x64" isRatio="square" src="c.png" />
    <Content isSize="small">
      <p>Prose</p>
    </Content>
    <Delete isSize="medium" />
    <Table isBordered isStriped isNarrow isFullWidth>
      <tbody>
        <tr>
          <td>1</td>
        </tr>
      </tbody>
    </Table>
    <Footer tag="div">Bye</Footer>
  </Container>
);
