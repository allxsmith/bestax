import { useState } from 'react';
import {
  Button,
  Column,
  Columns,
  Container,
  Content,
  Hero,
  Image,
  Title,
} from '@allxsmith/bestax-bulma';
import RoomDetailsModal from './RoomDetailsModal.tsx';

const rooms = [
  {
    name: 'Executive Gold Single',
    intro: 'The Executive Gold Single Rooms',
    photo:
      'https://images.unsplash.com/photo-1515510621228-30de609bbd60?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80',
    guests: 2,
    price: 119,
  },
  {
    name: 'Executive Gold Double',
    intro: 'The Executive Gold Double Rooms',
    photo:
      'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80',
    guests: 3,
    price: 239,
  },
  {
    name: 'Premier Diamond Single',
    intro: 'The Premier Diamond Single rooms',
    photo:
      'https://images.unsplash.com/photo-1590490360836-2e3b067c082b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80',
    guests: 2,
    price: 399,
  },
  {
    name: 'Premier Diamond Double',
    intro: 'The Premier Diamond Double rooms',
    photo:
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80',
    guests: 3,
    price: 499,
  },
];

/**
 * The rooms, side by side from the tablet breakpoint up. Each room's button
 * opens the hotel's details in a modal, which the original's buttons were
 * meant to open but never did.
 */
function Rooms() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <Hero id="rooms">
        <Hero.Body>
          <Container>
            <Columns className="rooms">
              {rooms.map(room => (
                <Column key={room.name}>
                  <Image as="figure" src={room.photo} alt={room.name} />
                  <Content>
                    {/* The original's empty div, which spaces the title as a heading that is not the first child. */}
                    <div />
                    <Title textSize="6">{room.name}</Title>
                    <p>
                      {room.intro} can hold <b>{room.guests} guests</b> (with
                      extra bed €50).
                    </p>
                    <Button
                      color="primary"
                      className="room-details"
                      aria-haspopup="dialog"
                      onClick={() => setDetailsOpen(true)}
                    >
                      View Details €{room.price}/day
                    </Button>
                  </Content>
                </Column>
              ))}
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>
      <RoomDetailsModal
        active={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}

export default Rooms;
