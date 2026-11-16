import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import Pagination from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Basic: Story = {
  render: () => (
    <Pagination>
      <Pagination.List>
        <Pagination.Link href="#previous" aria-label="Previous page">
          &laquo;
        </Pagination.Link>
        <Pagination.Link active href="#page-1">
          1
        </Pagination.Link>
        <Pagination.Link href="#page-2">2</Pagination.Link>
        <Pagination.Link href="#page-3">3</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link href="#page-10">10</Pagination.Link>
        <Pagination.Link href="#next" aria-label="Next page">
          &raquo;
        </Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};

export const Sizes: Story = {
  render: () => (
    <>
      <Pagination size="small" style={{ marginBottom: 8 }}>
        <Pagination.List>
          <Pagination.Link href="#page-1">1</Pagination.Link>
          <Pagination.Link active href="#page-2">
            2
          </Pagination.Link>
          <Pagination.Link href="#page-3">3</Pagination.Link>
        </Pagination.List>
      </Pagination>
      <Pagination size="medium" style={{ marginBottom: 8 }}>
        <Pagination.List>
          <Pagination.Link href="#page-1">1</Pagination.Link>
          <Pagination.Link active href="#page-2">
            2
          </Pagination.Link>
          <Pagination.Link href="#page-3">3</Pagination.Link>
        </Pagination.List>
      </Pagination>
      <Pagination size="large">
        <Pagination.List>
          <Pagination.Link href="#page-1">1</Pagination.Link>
          <Pagination.Link active href="#page-2">
            2
          </Pagination.Link>
          <Pagination.Link href="#page-3">3</Pagination.Link>
        </Pagination.List>
      </Pagination>
    </>
  ),
};

export const Alignment: Story = {
  render: () => (
    <>
      <Pagination align="centered" style={{ marginBottom: 8 }}>
        <Pagination.List>
          <Pagination.Link href="#page-1">1</Pagination.Link>
          <Pagination.Link active href="#page-2">
            2
          </Pagination.Link>
          <Pagination.Link href="#page-3">3</Pagination.Link>
        </Pagination.List>
      </Pagination>
      <Pagination align="right">
        <Pagination.List>
          <Pagination.Link href="#page-1">1</Pagination.Link>
          <Pagination.Link active href="#page-2">
            2
          </Pagination.Link>
          <Pagination.Link href="#page-3">3</Pagination.Link>
        </Pagination.List>
      </Pagination>
    </>
  ),
};

export const Rounded: Story = {
  render: () => (
    <Pagination rounded>
      <Pagination.List>
        <Pagination.Link href="#page-1">1</Pagination.Link>
        <Pagination.Link active href="#page-2">
          2
        </Pagination.Link>
        <Pagination.Link href="#page-3">3</Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Pagination>
      <Pagination.List>
        <Pagination.Link disabled aria-label="Previous page">
          &laquo;
        </Pagination.Link>
        <Pagination.Link active href="#page-1">
          1
        </Pagination.Link>
        <Pagination.Link href="#page-2">2</Pagination.Link>
        <Pagination.Link href="#page-3">3</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link href="#page-10">10</Pagination.Link>
        <Pagination.Link href="#next" aria-label="Next page">
          &raquo;
        </Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};

// Solution 1: Use a named component for stateful story
const ControlledPagination: React.FC = () => {
  const [page, setPage] = useState(1);
  return (
    <Pagination>
      <Pagination.List>
        <Pagination.Link
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          &laquo;
        </Pagination.Link>
        {[1, 2, 3, 4, 5].map(i => (
          <Pagination.Link
            key={i}
            active={i === page}
            onClick={() => setPage(i)}
          >
            {i}
          </Pagination.Link>
        ))}
        <Pagination.Ellipsis />
        <Pagination.Link onClick={() => setPage(page + 1)}>
          &raquo;
        </Pagination.Link>
      </Pagination.List>
      <div style={{ marginTop: 8 }}>Current page: {page}</div>
    </Pagination>
  );
};

export const Controlled: Story = {
  render: () => <ControlledPagination />,
};

// Rendered from a page count: Previous, Next and the page links, windowed.
const FromTotalPagination: React.FC = () => {
  const [page, setPage] = useState(10);
  return (
    <Pagination
      total={20}
      current={page}
      onPageChange={setPage}
      align="centered"
    />
  );
};

export const FromTotal: Story = {
  render: () => <FromTotalPagination />,
};

// Bulma-style markup story with Previous/Next and pagination list
export const PreviousNext: Story = {
  render: () => (
    <Pagination align="centered">
      <Pagination.Previous href="#previous">Previous</Pagination.Previous>
      <Pagination.Next href="#next">Next page</Pagination.Next>
      <Pagination.List>
        <Pagination.Link aria-label="Goto page 1" href="#page-1">
          1
        </Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link aria-label="Goto page 45" href="#page-45">
          45
        </Pagination.Link>
        <Pagination.Link active aria-label="Page 46" href="#page-46">
          46
        </Pagination.Link>
        <Pagination.Link aria-label="Goto page 47" href="#page-47">
          47
        </Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link aria-label="Goto page 86" href="#page-86">
          86
        </Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};

export const CompoundUsage: Story = {
  render: () => (
    <Pagination>
      <Pagination.Previous href="#previous">Previous</Pagination.Previous>
      <Pagination.Next href="#next">Next page</Pagination.Next>
      <Pagination.List>
        <Pagination.Link active href="#page-1">
          1
        </Pagination.Link>
        <Pagination.Link href="#page-2">2</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link href="#page-10">10</Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};
