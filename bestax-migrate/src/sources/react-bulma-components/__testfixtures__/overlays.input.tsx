import { Icon, Loader, Message, Modal, Progress, Table } from 'react-bulma-components';

export function Overlays({ show, close }: { show: boolean; close: () => void }) {
  return (
    <div>
      <Modal show={show} onClose={close} closeOnBlur>
        <Modal.Card>
          <Modal.Card.Header showClose>
            <Modal.Card.Title>Terms</Modal.Card.Title>
          </Modal.Card.Header>
          <Modal.Card.Body>
            <Message color="warning">
              <Message.Header>Heads up</Message.Header>
              <Message.Body>Read carefully</Message.Body>
            </Message>
            <Progress value={30} max={100} color="info" size="small" />
            <Loader />
          </Modal.Card.Body>
          <Modal.Card.Footer>
            <Icon color="success">
              <i className="fas fa-check" />
            </Icon>
            <Icon.Text>Saved</Icon.Text>
          </Modal.Card.Footer>
        </Modal.Card>
      </Modal>
      <Table.Container>
        <Table size="fullwidth" striped bordered hoverable>
          <tbody>
            <tr>
              <td>One</td>
            </tr>
          </tbody>
        </Table>
      </Table.Container>
    </div>
  );
}
