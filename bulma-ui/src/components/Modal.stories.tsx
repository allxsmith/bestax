import { useEffect, useRef, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Modal, ModalProps } from './Modal';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';

const declarationLatin = `Quando in cursu rerum humanarum fit ut populus aliquis dissolvere vincula politica quae eum cum alio coniunxerunt, et inter potestates terrae, statum separatam et aequalem, ad quem Iura Naturae et Dei Naturalis eum ius habere concedunt, rationabile decus postulat ut causas separationis declarent.`;

const meta: Meta<ModalProps> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
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
      <Button onClick={() => setOpen(true)}>Show Modal</Button>
      <Modal {...props} active={open} onClose={() => setOpen(false)}>
        {props.children}
      </Modal>
    </>
  );
};

// modal-card with title and footer
const ModalCardComponent = () => {
  const [open, setOpen] = useState(true);
  const closeModal = () => setOpen(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Modal</Button>
      <Modal
        active={open}
        onClose={closeModal}
        modalCardTitle="Modal Card Title"
        modalCardFoot={
          <Buttons>
            <Button color="success" onClick={closeModal}>
              Save
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </Buttons>
        }
      >
        {declarationLatin}
      </Modal>
    </>
  );
};

export const ModalCard: StoryObj<ModalProps> = {
  render: () => <ModalCardComponent />,
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
    <ControlledModal modalCardFoot={<Button color="success">Save</Button>}>
      {declarationLatin}
    </ControlledModal>
  ),
};

// The close buttons are drawn as icons, so their name is all a screen reader
// says about them. Here it's in the language of the modal, which `lang`
// declares.
export const CloseLabel: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal
      lang="fr"
      modalCardTitle="Modifier le profil"
      ariaCloseLabel="Fermer"
    >
      Vos modifications seront enregistrées.
    </ControlledModal>
  ),
};

// modal-content (no card title or foot)
export const ModalContent: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal>
      <Box>
        <Title as="h3" textSize="4">
          Custom Content
        </Title>
        <Paragraph>{declarationLatin}</Paragraph>
      </Box>
    </ControlledModal>
  ),
};

// Explicit type="content"
export const ModalContentExplicit: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal type="content">
      <Box>
        <Title as="h3" textSize="4">
          Explicit Content Modal
        </Title>
        <Paragraph>{declarationLatin}</Paragraph>
      </Box>
    </ControlledModal>
  ),
};

// Explicit type="card" (even if no title/footer)
export const ModalCardExplicit: StoryObj<ModalProps> = {
  render: () => (
    <ControlledModal type="card">{declarationLatin}</ControlledModal>
  ),
};

// Compound Components API - Modal.Card
const CompoundModalCardComponent = () => {
  const [open, setOpen] = useState(true);
  const closeModal = () => setOpen(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Modal</Button>
      {/* Escape and Modal.Close call onClose, the background its own onClick. */}
      <Modal
        isActive={open}
        onClose={closeModal}
        aria-labelledby="compound-modal-title"
      >
        <Modal.Background onClick={closeModal} />
        <Modal.Card>
          <Modal.Card.Head>
            <Modal.Card.Title id="compound-modal-title">
              Compound Component Modal
            </Modal.Card.Title>
            <Modal.Close />
          </Modal.Card.Head>
          <Modal.Card.Body>{declarationLatin}</Modal.Card.Body>
          <Modal.Card.Foot>
            <Buttons>
              <Button color="success" onClick={closeModal}>
                Save
              </Button>
              <Button onClick={closeModal}>Cancel</Button>
            </Buttons>
          </Modal.Card.Foot>
        </Modal.Card>
      </Modal>
    </>
  );
};

export const CompoundUsage: StoryObj<ModalProps> = {
  render: () => <CompoundModalCardComponent />,
};

// Compound Components API - Modal.Content
const CompoundModalContentComponent = () => {
  const [open, setOpen] = useState(true);
  const closeModal = () => setOpen(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Modal</Button>
      <Modal
        isActive={open}
        onClose={closeModal}
        aria-labelledby="compound-content-modal-title"
      >
        <Modal.Background onClick={closeModal} />
        <Modal.Content>
          <Box>
            <Title as="h3" textSize="4" id="compound-content-modal-title">
              Compound Component Content Modal
            </Title>
            <Paragraph>{declarationLatin}</Paragraph>
          </Box>
        </Modal.Content>
        <Modal.Close variant="floating" />
      </Modal>
    </>
  );
};

export const CompoundModalContent: StoryObj<ModalProps> = {
  render: () => <CompoundModalContentComponent />,
};

// Portal: renders into document.body instead of inline
const PortalModalComponent = () => {
  const [open, setOpen] = useState(true);
  return (
    <Box className="is-clipped">
      <p>
        This wrapper clips overflowing content (Bulma&apos;s{' '}
        <code>is-clipped</code>), so a modal rendered in place would be confined
        here. The one below is portaled to <code>document.body</code> instead.
      </p>
      <Button onClick={() => setOpen(true)}>Show Portaled Modal</Button>
      <Modal
        active={open}
        onClose={() => setOpen(false)}
        modalCardTitle="Rendered in document.body"
        portal
      >
        {declarationLatin}
      </Modal>
    </Box>
  );
};

export const Portal: StoryObj<ModalProps> = {
  render: () => <PortalModalComponent />,
};

// Forwarded ref: the root `.modal` div, used here for focus management. On
// open, focus moves to the first Button inside the modal, Save.
const ForwardedRefModalComponent = () => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const closeModal = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    modalRef.current?.querySelector<HTMLElement>('.button')?.focus();
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Modal</Button>
      <Modal
        ref={modalRef}
        active={open}
        onClose={closeModal}
        modalCardTitle="Focus Managed Modal"
        modalCardFoot={
          <Buttons>
            <Button color="success" onClick={closeModal}>
              Save
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </Buttons>
        }
      >
        {declarationLatin}
      </Modal>
    </>
  );
};

export const ForwardedRef: StoryObj<ModalProps> = {
  render: () => <ForwardedRefModalComponent />,
};
