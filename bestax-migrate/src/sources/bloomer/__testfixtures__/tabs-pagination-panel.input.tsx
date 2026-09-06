import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  Dropdown,
  DropdownDivider,
  DropdownItem,
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

export const Navigation = ({ onSelect }: { onSelect: () => void }) => (
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
    <Tabs isAlign="centered" isBoxed isSize="small" isFullWidth>
      <TabList>
        <Tab isActive>
          <TabLink href="#one">One</TabLink>
        </Tab>
        <Tab>
          <TabLink onClick={onSelect}>Two</TabLink>
        </Tab>
      </TabList>
    </Tabs>
    <Pagination isAlign="left" isSize="medium">
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
        <Page className="mine">
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
      <PanelBlock isWrapped>
        <PanelIcon className="fa fa-code-fork" />
        fork
      </PanelBlock>
      <PanelBlock tag="label" isActive>
        <input type="checkbox" /> remember
      </PanelBlock>
    </Panel>
    <Dropdown isActive isAlign="right" isHoverable>
      <DropdownItem isActive href="/a">
        A
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem tag="div">B</DropdownItem>
      <DropdownItem>C</DropdownItem>
    </Dropdown>
  </>
);
