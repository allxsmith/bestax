import { useState } from 'react';
import {
  Button,
  Container,
  Hero as BulmaHero,
  Notification,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

// The upstream page toggled this panel with a script; the port keeps it in
// state, the way the porting guide's step 4 asks.
export default function Hero() {
  const [open, setOpen] = useState(false);

  return (
    <BulmaHero color="primary" size="medium">
      <BulmaHero.Body>
        <Container>
          <Title>Example Template</Title>
          <SubTitle>A fixture for the templates checks</SubTitle>
          <Button
            color="light"
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
          >
            {open ? 'Hide details' : 'Show details'}
          </Button>
          {open && <Notification mt="4">Ported with bestax.</Notification>}
        </Container>
      </BulmaHero.Body>
    </BulmaHero>
  );
}
