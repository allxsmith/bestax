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
        <Pagination.Link>&laquo;</Pagination.Link>
        <Pagination.Link active>1</Pagination.Link>
        <Pagination.Link>2</Pagination.Link>
        <Pagination.Link>3</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link>10</Pagination.Link>
        <Pagination.Link>&raquo;</Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};

export const Sizes: Story = {
  render: () => (
    <>
      <Pagination size="small" style={{ marginBottom: 8 }}>
        <Pagination.List>
          <Pagination.Link>1</Pagination.Link>
          <Pagination.Link active>2</Pagination.Link>
          <Pagination.Link>3</Pagination.Link>
        </Pagination.List>
      </Pagination>
      <Pagination size="medium" style={{ marginBottom: 8 }}>
        <Pagination.List>
          <Pagination.Link>1</Pagination.Link>
          <Pagination.Link active>2</Pagination.Link>
          <Pagination.Link>3</Pagination.Link>
        </Pagination.List>
      </Pagination>
      <Pagination size="large">
        <Pagination.List>
          <Pagination.Link>1</Pagination.Link>
          <Pagination.Link active>2</Pagination.Link>
          <Pagination.Link>3</Pagination.Link>
        </Pagination.List>
      </Pagination>
    </>
  ),
};

export const Colors: Story = {
  render: () => (
    <>
      <Pagination color="primary" style={{ marginBottom: 8 }}>
        <Pagination.List>
          <Pagination.Link>1</Pagination.Link>
          <Pagination.Link active>2</Pagination.Link>
          <Pagination.Link>3</Pagination.Link>
        </Pagination.List>
      </Pagination>
      <Pagination color="danger">
        <Pagination.List>
          <Pagination.Link>1</Pagination.Link>
          <Pagination.Link active>2</Pagination.Link>
          <Pagination.Link>3</Pagination.Link>
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
          <Pagination.Link>1</Pagination.Link>
          <Pagination.Link active>2</Pagination.Link>
          <Pagination.Link>3</Pagination.Link>
        </Pagination.List>
      </Pagination>
      <Pagination align="right">
        <Pagination.List>
          <Pagination.Link>1</Pagination.Link>
          <Pagination.Link active>2</Pagination.Link>
          <Pagination.Link>3</Pagination.Link>
        </Pagination.List>
      </Pagination>
    </>
  ),
};

export const Rounded: Story = {
  render: () => (
    <Pagination rounded>
      <Pagination.List>
        <Pagination.Link>1</Pagination.Link>
        <Pagination.Link active>2</Pagination.Link>
        <Pagination.Link>3</Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Pagination>
      <Pagination.List>
        <Pagination.Link disabled>&laquo;</Pagination.Link>
        <Pagination.Link active>1</Pagination.Link>
        <Pagination.Link>2</Pagination.Link>
        <Pagination.Link>3</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link>10</Pagination.Link>
        <Pagination.Link>&raquo;</Pagination.Link>
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

// Bulma-style markup story with Previous/Next and pagination list
export const PreviousNext: Story = {
  render: () => (
    <Pagination align="centered">
      <Pagination.Previous>Previous</Pagination.Previous>
      <Pagination.Next>Next page</Pagination.Next>
      <Pagination.List>
        <Pagination.Link aria-label="Goto page 1">1</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link aria-label="Goto page 45">45</Pagination.Link>
        <Pagination.Link active aria-label="Page 46">
          46
        </Pagination.Link>
        <Pagination.Link aria-label="Goto page 47">47</Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link aria-label="Goto page 86">86</Pagination.Link>
      </Pagination.List>
    </Pagination>
  ),
};
