import { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Modal, ModalProps } from './Modal';

const declarationLatin = `Quando in cursu rerum humanarum fit ut populus aliquis dissolvere vincula politica quae eum cum alio coniunxerunt, et inter potestates terrae, statum separatam et aequalem, ad quem Iura Naturae et Dei Naturalis eum ius habere concedunt, rationabile decus postulat ut causas separationis declarent.`;

const meta: Meta<ModalProps> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    controls: { expanded: true },
  },
};
export default meta;

// Helper for controlling modal in stories
const ControlledModal = (props: ModalProps) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Show Modal</button>
      <Modal {...props} active={open} onClose={() => setOpen(false)}>
        {props.children}
      </Modal>
    </>
  );
};

// modal-card with title and footer
export const ModalCard: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal
      modalCardTitle="Modal Card Title"
      modalCardFoot={
        <>
          <button className="button is-success">Save</button>
          <button className="button">Cancel</button>
        </>
      }
    >
      {declarationLatin}
    </ControlledModal>
  ),
};

// modal-card with only title
export const ModalCardTitleOnly: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal modalCardTitle="Modal Card Title Only">
      {declarationLatin}
    </ControlledModal>
  ),
};

// modal-card with only footer
export const ModalCardFooterOnly: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal
      modalCardFoot={
        <>
          <button className="button is-success">Save</button>
        </>
      }
    >
      {declarationLatin}
    </ControlledModal>
  ),
};

// modal-content (no card title or foot)
export const ModalContent: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal>
      <div style={{ background: '#fff', padding: 24, borderRadius: 4 }}>
        <h3 className="title is-4">Custom Content</h3>
        <p>{declarationLatin}</p>
      </div>
    </ControlledModal>
  ),
};

// Explicit type="content"
export const ModalContentExplicit: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal type="content">
      <div style={{ background: '#fff', padding: 24, borderRadius: 4 }}>
        <h3 className="title is-4">Explicit Content Modal</h3>
        <p>{declarationLatin}</p>
      </div>
    </ControlledModal>
  ),
};

// Explicit type="card" (even if no title/footer)
export const ModalCardExplicit: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal type="card">{declarationLatin}</ControlledModal>
  ),
};
