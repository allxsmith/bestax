import { Icon, IconText, Message, Modal, Progress, Table } from "@allxsmith/bestax-bulma";

export function Overlays({ show, close }: { show: boolean; close: () => void }) {
  // TODO(bestax-migrate): `closeOnBlur` — bestax Modal closes on background click only in its legacy form; the Modal.Content/Modal.Card child selects the compound form, which renders only the children you wrote — add a `<Modal.Background>` whose `onClick` calls your close handler, or drop the prop if you passed false
  // TODO(bestax-migrate): bestax `Modal` is a dialog while it's open, and this one has no `aria-label` or `aria-labelledby` to name it: give it an `aria-label`, or an `aria-labelledby` pointing at the `id` of its title, such as its `Modal.Card.Title` when it has one
  // TODO(bestax-migrate): `showClose` — render a <Delete onClick={...}/> in the head instead
  // TODO(bestax-migrate): Table.Container folded into `isResponsive` on a Table with no `aria-label` or `aria-labelledby`: while it overflows, `Table isResponsive` makes its container a region you can tab to, named by those alone, so give the Table one, such as an `aria-labelledby` pointing at a heading or at its caption's `id`
  return (
    <div>
      <Modal active={show} onClose={close} closeOnBlur>
        <Modal.Card>
          <Modal.Card.Head showClose>
            <Modal.Card.Title>Terms</Modal.Card.Title>
          </Modal.Card.Head>
          <Modal.Card.Body>
            <Message color="warning" size="small">
              <Message.Header>Heads up</Message.Header>
              <Message.Body>Read carefully</Message.Body>
            </Message>
            <Progress value={30} max={100} color="info" size="small" />
            <div className="loader"></div>
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
