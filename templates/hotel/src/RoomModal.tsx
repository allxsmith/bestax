import {
  Column,
  Columns,
  Content,
  Icon,
  Link,
  Modal,
} from '@allxsmith/bestax-bulma';

const facilities = [
  [
    'Free Wi-Fi Connectivity',
    'Complimentary Breakfast',
    'Doc on Call',
    'Board Rooms',
    'Electronic Card Locks',
    'In Room Safe',
  ],
  [
    'Laundry Facility',
    'Hair Dryer',
    'Travel Assistance',
    '24 hrs Check-in & Check-out',
    'Coffee / Tea Maker in Room',
    'Mini Bar',
  ],
];

interface RoomModalProps {
  /** The room whose details are open, or null while the modal is closed. */
  room: string | null;
  onClose: () => void;
}

/**
 * The details every room's button opens: the hotel's numbers and its
 * facilities. `Modal` calls `onClose` on Escape; the background and the
 * close button call it here.
 */
function RoomModal({ room, onClose }: RoomModalProps) {
  return (
    <Modal
      active={room !== null}
      onClose={onClose}
      aria-label={room ? `${room}: facilities and features` : undefined}
    >
      <Modal.Background onClick={onClose} />
      <Modal.Content className="room-modal">
        <Content>
          <Columns>
            <Column>
              <img
                src="https://bulma.io/assets/images/bulma-logo.png"
                alt="Bulma Hotels"
                width="150"
              />
            </Column>
            <Column>
              <div>
                <Icon name="phone" /> <span>Phone Number</span> &nbsp;{' '}
                <Link textColor="black" href="tel:+30 2109999999">
                  +30 2109999999
                </Link>
              </div>
              <div>
                <Icon name="phone" /> <span>Reservation</span> &nbsp;{' '}
                <Link textColor="black" href="tel:+30 2109999997">
                  +30 210999997
                </Link>
              </div>
            </Column>
          </Columns>
          <h3>Facilities &amp; Features</h3>
          <Columns>
            {facilities.map(list => (
              <Column key={list[0]}>
                <ul>
                  {list.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Column>
            ))}
          </Columns>
        </Content>
      </Modal.Content>
      <Modal.Close variant="floating" size="large" onClick={onClose} />
    </Modal>
  );
}

export default RoomModal;
