import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Image,
  Title,
  SubTitle,
  Notification,
  Columns,
  Column,
  Container,
  Section,
  Card,
  Buttons,
} from '@allxsmith/bestax-bulma';
import './App.css';

function App() {
  const [showNotification, setShowNotification] = useState(false);
  const [count, setCount] = useState(0);
  // Where focus goes when the button holding it goes away (the notification's
  // close button) or disables itself (Reset, at zero), so a keyboard user is
  // not dropped at the top of the page.
  const toggleRef = useRef(null);
  const countRef = useRef(null);

  return (
    <main>
      <Section>
        <Container breakpoint="desktop" isMax>
          <Columns isCentered isMobile isMultiline>
            <Column isNarrow>
              <Image src="/bestax.svg" alt="Bestax" size="128x128" />
            </Column>
            <Column isNarrow>
              <Image src="/vite.svg" alt="Vite" size="128x128" />
            </Column>
            <Column isNarrow>
              <Image src="/react.svg" alt="React" size="128x128" />
            </Column>
          </Columns>
          <Title size="1" textAlign="centered">
            Bestax + Vite + React
          </Title>

          <Box>
            <Title as="h2">Get Started</Title>
            <SubTitle as="p" size="5">
              This template includes everything you need to build with
              bestax-bulma
            </SubTitle>
          </Box>

          <Columns>
            <Column display="flex">
              <Card flexGrow="1">
                <Card.Header>
                  <Card.Header.Title as="h3">Quick Start</Card.Header.Title>
                </Card.Header>
                <Card.Content>
                  Edit src/App.jsx and save to test HMR updates.
                </Card.Content>
              </Card>
            </Column>

            <Column display="flex">
              <Card flexGrow="1">
                <Card.Header>
                  <Card.Header.Title as="h3">Documentation</Card.Header.Title>
                </Card.Header>
                <Card.Content>
                  Visit{' '}
                  <a
                    className="text-link"
                    href="https://bestax.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    bestax.io
                  </a>{' '}
                  for component docs.
                </Card.Content>
              </Card>
            </Column>

            <Column display="flex">
              <Card flexGrow="1">
                <Card.Header>
                  <Card.Header.Title as="h3">Examples</Card.Header.Title>
                </Card.Header>
                <Card.Content>
                  Check the examples below to see components in action.
                </Card.Content>
              </Card>
            </Column>
          </Columns>

          <Box>
            <Title as="h2">Interactive Example</Title>

            <Columns isVCentered>
              <Column size="half">
                <Buttons>
                  <Button
                    ref={toggleRef}
                    color="primary"
                    onClick={() => setShowNotification(!showNotification)}
                  >
                    Toggle Notification
                  </Button>

                  <Button
                    ref={countRef}
                    color="info"
                    onClick={() => setCount(count + 1)}
                  >
                    Count: {count}
                  </Button>

                  <Button
                    color="warning"
                    onClick={() => {
                      setCount(0);
                      countRef.current?.focus();
                    }}
                    disabled={count === 0}
                  >
                    Reset
                  </Button>
                </Buttons>
              </Column>

              {/* A status region reads out what appears in it, so a screen
                  reader hears both notifications. It stays mounted while its
                  content changes: one added along with its content may not
                  be announced. */}
              <Column size="half" role="status">
                {showNotification && (
                  <Notification
                    color="success"
                    isLight
                    hasDelete
                    onDelete={() => {
                      setShowNotification(false);
                      toggleRef.current?.focus();
                    }}
                  >
                    <strong>Success!</strong> Your Vite + Bestax setup is
                    working perfectly!
                  </Notification>
                )}

                {count > 10 && (
                  <Notification color="info" isLight>
                    You&apos;ve clicked the button {count} times!
                  </Notification>
                )}
              </Column>
            </Columns>
          </Box>
        </Container>
      </Section>
    </main>
  );
}

export default App;
