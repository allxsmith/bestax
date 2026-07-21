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
        <Panel.Icon name="user" variant="solid" />
        George Washington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Alexander Hamilton
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Benedict Arnold
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        John Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Battle of Saratoga
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Treaty of Paris
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        George Washington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Marquis de Lafayette
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Nathanael Greene
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Battle of Trenton
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        Alexander Hamilton
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Thomas Jefferson
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        John Jay
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Federalist Papers
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        Benedict Arnold
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        John Paul Jones
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Baron von Steuben
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Bunker Hill
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        Marquis de Lafayette
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Deborah Sampson
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Abigail Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Yorktown
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        Thomas Paine
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Samuel Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Mercy Otis Warren
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Valley Forge
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        King George III
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Charles Cornwallis
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Benedict Arnold
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Boston Massacre
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        John Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Crispus Attucks
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Sybil Ludington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Lexington & Concord
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        Samuel Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Haym Salomon
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Roger Sherman
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Continental Congress
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        Abigail Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Martha Washington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Phillis Wheatley
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Declaration of Independence
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
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
        <Panel.Icon name="user" variant="solid" />
        Paul Revere
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        John Hancock
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Patrick Henry
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Midnight Ride
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Give Me Liberty
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};

export const CompoundUsage: Story = {
  render: () => (
    <Panel>
      <Panel.Heading>Continental Congress</Panel.Heading>
      <Panel.Tabs>
        <a className="is-active">All</a>
        <a>Delegates</a>
      </Panel.Tabs>
      <Panel.Block active>
        <Panel.Icon name="user" variant="solid" />
        John Adams
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Benjamin Franklin
      </Panel.Block>
      <Panel.CheckboxBlock>remember me</Panel.CheckboxBlock>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ),
};
