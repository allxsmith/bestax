import React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import Panel from './Panel';

const meta: Meta<typeof Panel> = {
  title: 'Components/Panel',
  component: Panel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const RevolutionaryWar: Story = {
  render: () => (
    <Panel>
      <Panel.Heading>Revolutionary Figures</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Tabs>
        <a className="is-active">All</a>
        <a>Patriots</a>
        <a>Loyalists</a>
        <a>Battles</a>
        <a>Documents</a>
      </Panel.Tabs>
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        George Washington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Alexander Hamilton
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Benedict Arnold
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        John Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Battle of Saratoga
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Treaty of Paris
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Bunker Hill
      </Panel.Block>
      <Panel.CheckboxBlock>remember me</Panel.CheckboxBlock>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Primary: Story = {
  render: () => (
    <Panel color="primary">
      <Panel.Heading>Primary Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        George Washington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Marquis de Lafayette
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Nathanael Greene
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Battle of Trenton
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Yorktown
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Link: Story = {
  render: () => (
    <Panel color="link">
      <Panel.Heading>Link Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Alexander Hamilton
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Thomas Jefferson
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        John Jay
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Federalist Papers
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Treaty of Paris
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Info: Story = {
  render: () => (
    <Panel color="info">
      <Panel.Heading>Info Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Benedict Arnold
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        John Paul Jones
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Baron von Steuben
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Bunker Hill
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Valley Forge
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Success: Story = {
  render: () => (
    <Panel color="success">
      <Panel.Heading>Success Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Marquis de Lafayette
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Deborah Sampson
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Abigail Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Yorktown
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Declaration of Independence
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Warning: Story = {
  render: () => (
    <Panel color="warning">
      <Panel.Heading>Warning Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Thomas Paine
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Samuel Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Mercy Otis Warren
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Valley Forge
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Olive Branch Petition
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Danger: Story = {
  render: () => (
    <Panel color="danger">
      <Panel.Heading>Danger Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        King George III
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Charles Cornwallis
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Benedict Arnold
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Boston Massacre
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Intolerable Acts
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Black: Story = {
  render: () => (
    <Panel color="black">
      <Panel.Heading>Black Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        John Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Crispus Attucks
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Sybil Ludington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Lexington & Concord
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Boston Tea Party
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Dark: Story = {
  render: () => (
    <Panel color="dark">
      <Panel.Heading>Dark Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Samuel Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Haym Salomon
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Roger Sherman
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Continental Congress
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Articles of Confederation
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const Light: Story = {
  render: () => (
    <Panel color="light">
      <Panel.Heading>Light Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Abigail Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Martha Washington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Phillis Wheatley
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Declaration of Independence
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Bill of Rights
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const White: Story = {
  render: () => (
    <Panel color="white">
      <Panel.Heading>White Panel</Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Paul Revere
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        John Hancock
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-user" aria-hidden="true"></i>
        </Panel.Icon>
        Patrick Henry
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Midnight Ride
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon>
          <i className="fas fa-flag" aria-hidden="true"></i>
        </Panel.Icon>
        Give Me Liberty
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};
