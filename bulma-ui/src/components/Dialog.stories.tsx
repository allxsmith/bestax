import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Dialog, DialogContainer, dialog } from './Dialog';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';
import { Control } from '../form/Control';
import { Field } from '../form/Field';
import { Input } from '../form/Input';
import { Section } from '../layout/Section';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A dialog component for alerts and confirmations. Supports different types, custom icons, and programmatic API.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    message: {
      control: 'text',
      description: 'Dialog message',
    },
    type: {
      control: 'select',
      options: ['default', 'success', 'danger', 'warning', 'info'],
      description: 'The type/color of the dialog',
    },
    confirmText: {
      control: 'text',
      description: 'Text for confirm button',
    },
    cancelText: {
      control: 'text',
      description: 'Text for cancel button',
    },
    showCancel: {
      control: 'boolean',
      description: 'Whether to show cancel button',
    },
    canCancel: {
      control: 'boolean',
      description: 'Whether the dialog can be dismissed',
    },
    focusCancel: {
      control: 'boolean',
      description: 'Focus cancel button instead of confirm',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

/**
 * Basic alert dialog.
 */
export const Alert: Story = {
  render: function AlertExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="primary" onClick={() => setIsOpen(true)}>
          Show Alert
        </Button>
        <Dialog
          isOpen={isOpen}
          title="Information"
          message="This is an alert dialog with important information."
          onConfirm={() => setIsOpen(false)}
          showCancel={false}
        />
      </Section>
    );
  },
};

/**
 * Confirmation dialog.
 */
export const Confirm: Story = {
  render: function ConfirmExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleConfirm = () => {
      setResult('Confirmed!');
      setIsOpen(false);
    };

    const handleCancel = () => {
      setResult('Cancelled');
      setIsOpen(false);
    };

    return (
      <Section>
        <Button color="primary" onClick={() => setIsOpen(true)}>
          Show Confirm Dialog
        </Button>
        {result && <Paragraph mt="4">Result: {result}</Paragraph>}
        <Dialog
          isOpen={isOpen}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </Section>
    );
  },
};

/**
 * Different dialog types.
 */
export const Types: Story = {
  render: function TypesExample() {
    const [openType, setOpenType] = useState<string | null>(null);

    const types = [
      {
        type: 'success',
        title: 'Success',
        message: 'Operation completed successfully!',
      },
      {
        type: 'danger',
        title: 'Error',
        message: 'An error occurred while processing.',
      },
      {
        type: 'warning',
        title: 'Warning',
        message: 'This action may have consequences.',
      },
      {
        type: 'info',
        title: 'Information',
        message: 'Here is some useful information.',
      },
    ] as const;

    return (
      <Section>
        <Buttons>
          {types.map(({ type, title }) => (
            <Button
              key={type}
              color={type === 'default' ? undefined : type}
              onClick={() => setOpenType(type)}
            >
              {title}
            </Button>
          ))}
        </Buttons>
        {types.map(({ type, title, message }) => (
          <Dialog
            key={type}
            isOpen={openType === type}
            title={title}
            message={message}
            type={type}
            onConfirm={() => setOpenType(null)}
            showCancel={false}
          />
        ))}
      </Section>
    );
  },
};

/**
 * Delete confirmation dialog.
 */
export const DeleteConfirmation: Story = {
  render: function DeleteExample() {
    const [isOpen, setIsOpen] = useState(false);

    const handleDelete = () => {
      alert('Item deleted!');
      setIsOpen(false);
    };

    return (
      <Section>
        <Button color="danger" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <Dialog
          isOpen={isOpen}
          title="Delete Item?"
          message="Are you sure you want to delete this item? This action cannot be undone."
          type="danger"
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setIsOpen(false)}
          focusCancel
        />
      </Section>
    );
  },
};

/**
 * Non-dismissible dialog.
 */
export const NonDismissible: Story = {
  render: function NonDismissibleExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="warning" onClick={() => setIsOpen(true)}>
          Show Required Dialog
        </Button>
        <Paragraph mt="4" className="help">
          This dialog cannot be closed by clicking outside or pressing Escape
        </Paragraph>
        <Dialog
          isOpen={isOpen}
          title="Required Confirmation"
          message="You must confirm to continue. This dialog cannot be dismissed."
          type="warning"
          canCancel={false}
          showCancel={false}
          onConfirm={() => setIsOpen(false)}
        />
      </Section>
    );
  },
};

/**
 * Custom content in dialog.
 */
export const CustomContent: Story = {
  render: function CustomContentExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="primary" onClick={() => setIsOpen(true)}>
          Show Custom Dialog
        </Button>
        <Dialog
          isOpen={isOpen}
          title="Terms of Service"
          message={
            <div>
              <Paragraph mb="4">Please review our terms of service:</Paragraph>
              <Box style={{ maxHeight: '150px', overflowY: 'auto' }}>
                <Paragraph>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </Paragraph>
                <Paragraph>
                  Sed do eiusmod tempor incididunt ut labore et dolore.
                </Paragraph>
                <Paragraph>
                  Ut enim ad minim veniam, quis nostrud exercitation.
                </Paragraph>
              </Box>
            </div>
          }
          confirmText="I Agree"
          cancelText="Decline"
          onConfirm={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </Section>
    );
  },
};

/**
 * Programmatic dialog API.
 */
export const ProgrammaticAPI: Story = {
  render: function ProgrammaticExample() {
    const handleAlert = async () => {
      await dialog.alert({
        title: 'Alert',
        message: 'This is a programmatic alert!',
        type: 'info',
      });
      console.log('Alert closed');
    };

    const handleConfirm = async () => {
      const result = await dialog.confirm({
        title: 'Confirm',
        message: 'Do you want to proceed?',
        confirmText: 'Yes',
        cancelText: 'No',
      });
      console.log('Confirm result:', result);
      if (result) {
        await dialog.alert({
          title: 'Success',
          message: 'You confirmed!',
          type: 'success',
        });
      }
    };

    const handleDanger = async () => {
      const result = await dialog.confirm({
        title: 'Delete Account?',
        message:
          'This will permanently delete your account and all data. This action cannot be undone.',
        type: 'danger',
        confirmText: 'Delete',
        focusCancel: true,
      });
      if (result) {
        await dialog.alert({
          title: 'Deleted',
          message: 'Your account has been deleted.',
          type: 'danger',
        });
      }
    };

    return (
      <Section>
        <DialogContainer />
        <Buttons>
          <Button onClick={handleAlert}>Show Alert</Button>
          <Button color="primary" onClick={handleConfirm}>
            Show Confirm
          </Button>
          <Button color="danger" onClick={handleDanger}>
            Dangerous Action
          </Button>
        </Buttons>
      </Section>
    );
  },
};

/**
 * Custom icon dialog.
 */
export const CustomIcon: Story = {
  render: function CustomIconExample() {
    const [isOpen, setIsOpen] = useState(false);

    const customIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );

    return (
      <Section>
        <Button color="info" onClick={() => setIsOpen(true)}>
          Show Security Dialog
        </Button>
        <Dialog
          isOpen={isOpen}
          title="Security Check"
          message="Your connection is secure and encrypted."
          type="info"
          icon={customIcon}
          onConfirm={() => setIsOpen(false)}
          showCancel={false}
        />
      </Section>
    );
  },
};

/**
 * Form submission dialog.
 */
export const FormSubmission: Story = {
  render: function FormExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Box>
          <Title size="5">Contact Form</Title>
          <Field label="Name">
            <Control>
              <Input type="text" placeholder="Your name" />
            </Control>
          </Field>
          <Field label="Email">
            <Control>
              <Input type="email" placeholder="your@email.com" />
            </Control>
          </Field>
          <Button color="primary" onClick={() => setIsOpen(true)}>
            Submit
          </Button>
        </Box>
        <Dialog
          isOpen={isOpen}
          title="Submit Form?"
          message="Are you sure you want to submit this form?"
          onConfirm={() => {
            alert('Form submitted!');
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      </Section>
    );
  },
};
