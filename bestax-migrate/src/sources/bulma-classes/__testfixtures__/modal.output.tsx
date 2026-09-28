import { Button, Buttons, Delete, Modal } from "@allxsmith/bestax-bulma";
export function Dialogs() {
  // TODO(bestax-migrate): `.modal` stays as markup: bestax `Modal` writes a `data-testid` of its own over the one it's given, and adds dialog attributes and focus handling, so rebuild the root with it by hand; its parts convert on their own
  return (
    <section>
      <div className="modal">
        <Modal.Background></Modal.Background>
        <Modal.Card>
          <Modal.Card.Head>
            <Modal.Card.Title>Modal title</Modal.Card.Title>
            <Delete aria-label="close"></Delete>
          </Modal.Card.Head>
          <Modal.Card.Body className="has-text-centered">Content</Modal.Card.Body>
          <Modal.Card.Foot>
            <Buttons>
              <Button color="success">Save changes</Button>
              <Button>Cancel</Button>
            </Buttons>
          </Modal.Card.Foot>
        </Modal.Card>
      </div>
      <div className="modal">
        <Modal.Background />
        <Modal.Content className="has-background-white p-4">
          Any content
        </Modal.Content>
        <button className="modal-close is-large" aria-label="close" />
      </div>
    </section>
  );
}
