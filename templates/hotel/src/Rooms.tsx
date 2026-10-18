import { useState } from 'react';
import {
  Button,
  Column,
  Columns,
  Container,
  Content,
  Hero,
  Image,
  Paragraph,
  Strong,
  Title,
} from '@allxsmith/bestax-bulma';
import RoomModal from './RoomModal.tsx';

const unsplash = (photo: string) =>
  `https://images.unsplash.com/photo-${photo}?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80`;

const rooms = [
  {
    name: 'Executive Gold Single',
    photo: unsplash('1515510621228-30de609bbd60'),
    lead: 'The Executive Gold Single Rooms can hold',
    guests: 2,
    price: 119,
  },
  {
    name: 'Executive Gold Double',
    photo: unsplash('1444201983204-c43cbd584d93'),
    lead: 'The Executive Gold Double Rooms can hold',
    guests: 3,
    price: 239,
  },
  {
    name: 'Premier Diamond Single',
    photo: unsplash('1590490360836-2e3b067c082b'),
    lead: 'The Premier Diamond Single rooms can hold',
    guests: 2,
    price: 399,
  },
  {
    name: 'Premier Diamond Double',
    photo: unsplash('1512918728675-ed5a9ecdebfd'),
    lead: 'The Premier Diamond Double rooms can hold',
    guests: 3,
    price: 499,
  },
];

/**
 * The rooms, side by side on a white panel. Each one's button opens the
 * details modal, which the original never wired up.
 */
function Rooms() {
  const [openRoom, setOpenRoom] = useState<string | null>(null);

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
                    <Title textSize="6" mt="4">
                      {room.name}
                    </Title>
                    <Paragraph>
                      {room.lead} <Strong>{room.guests} guests</Strong> (with
                      extra bed €50).
                    </Paragraph>
                    <Button
                      color="primary"
                      className="room-button"
                      onClick={() => setOpenRoom(room.name)}
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
      <RoomModal room={openRoom} onClose={() => setOpenRoom(null)} />
    </>
  );
}

export default Rooms;
