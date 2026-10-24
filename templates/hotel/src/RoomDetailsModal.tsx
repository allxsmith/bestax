import { Column, Columns, Content, Modal } from '@allxsmith/bestax-bulma';

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

interface RoomDetailsModalProps {
  active: boolean;
  onClose: () => void;
}

/**
 * The hotel's phone numbers and facilities, which every room's "View
 * Details" button opens. `Modal` closes it on Escape itself; the background
 * and the close button are parts written out here, so each calls `onClose`.
 */
function RoomDetailsModal({ active, onClose }: RoomDetailsModalProps) {
  return (
    <Modal
      active={active}
      onClose={onClose}
      aria-labelledby="room-details-title"
    >
      <Modal.Background onClick={onClose} />
      <Modal.Content>
        <Content>
          <Columns>
            <Column>
              <img src="/media/bulma-logo.png" alt="Bulma Hotels" width={150} />
            </Column>
            <Column>
              <div>
                <i className="fa fa-phone-flip" aria-hidden="true" /> &nbsp;{' '}
                <span>Phone Number</span> &nbsp;{' '}
                <a style={{ color: 'black' }} href="tel:+30 2109999999">
                  +30 2109999999
                </a>
              </div>
              <div>
                <i className="fa fa-phone-flip" aria-hidden="true" /> &nbsp;{' '}
                <span>Reservation</span> &nbsp;{' '}
                <a style={{ color: 'black' }} href="tel:+30 2109999997">
                  +30 2109999997
                </a>
              </div>
            </Column>
          </Columns>
          <h3 id="room-details-title">Facilities &amp; Features</h3>
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
      <Modal.Close variant="floating" onClick={onClose} />
    </Modal>
  );
}

export default RoomDetailsModal;
