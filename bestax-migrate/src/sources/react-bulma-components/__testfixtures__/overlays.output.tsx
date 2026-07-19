import { Icon, IconText, Loading, Message, Modal, Progress, Table } from "@allxsmith/bestax-bulma";

export function Overlays({ show, close }: { show: boolean; close: () => void }) {
  // TODO(bestax-migrate): `closeOnBlur` — bestax Modal background click closes when onClose is set; remove
  // TODO(bestax-migrate): `showClose` — render a <Delete onClick={...}/> in the head instead
  return (
    <div>
      <Modal active={show} onClose={close} closeOnBlur>
        <Modal.Card>
          <Modal.Card.Head showClose>
            <Modal.Card.Title>Terms</Modal.Card.Title>
          </Modal.Card.Head>
          <Modal.Card.Body>
            <Message color="warning">
              <Message.Header>Heads up</Message.Header>
              <Message.Body>Read carefully</Message.Body>
            </Message>
            <Progress value={30} max={100} color="info" size="small" />
            <Loading active />
          </Modal.Card.Body>
          <Modal.Card.Foot>
            <Icon color="success" name="check" library="fa" variant="solid" />
            <IconText>Saved</IconText>
          </Modal.Card.Foot>
        </Modal.Card>
      </Modal>
      <Table isResponsive isFullwidth isStriped isBordered isHoverable>
        <tbody>
          <tr>
            <td>One</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}
