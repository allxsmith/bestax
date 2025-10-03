import { useState } from 'react';
import {
  Box,
  Button,
  Title,
  SubTitle,
  Notification,
  Columns,
  Column,
  Container,
  Section,
  Card,
  Hero,
} from '@allxsmith/bestax-bulma';
import './App.css';

function App() {
  const [showNotification, setShowNotification] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <>
      <Hero color="primary" size="medium">
        <Hero.Body>
          <Container>
            <Title size="1" textAlign="centered" textColor="white">
              Welcome to Bestax + Vite
            </Title>
            <SubTitle size="3" textAlign="centered" textColor="white">
              Build amazing React apps with Bulma components
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Container>
        <Section>
          <Columns isCentered>
            <Column size="three-quarters">
              <Box>
                <Title size="3">Get Started</Title>
                <SubTitle size="5" textColor="grey">
                  This template includes everything you need to build with
                  bestax-bulma
                </SubTitle>

                <Columns mt="5">
                  <Column>
                    <Card>
                      <Card.Header>
                        <Card.Header.Title>Quick Start</Card.Header.Title>
                      </Card.Header>
                      <Card.Content>
                        Edit src/App.jsx and save to test HMR updates.
                      </Card.Content>
                    </Card>
                  </Column>

                  <Column>
                    <Card>
                      <Card.Header>
                        <Card.Header.Title>Documentation</Card.Header.Title>
                      </Card.Header>
                      <Card.Content>
                        Visit{' '}
                        <a
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

                  <Column>
                    <Card>
                      <Card.Header>
                        <Card.Header.Title>Examples</Card.Header.Title>
                      </Card.Header>
                      <Card.Content>
                        Check the examples below to see components in action.
                      </Card.Content>
                    </Card>
                  </Column>
                </Columns>
              </Box>

              <Box mt="5">
                <Title size="4">Interactive Example</Title>

                <Columns isVCentered mt="4">
                  <Column size="half">
                    <div className="buttons">
                      <Button
                        color="primary"
                        onClick={() => setShowNotification(!showNotification)}
                      >
                        Toggle Notification
                      </Button>

                      <Button color="info" onClick={() => setCount(count + 1)}>
                        Count: {count}
                      </Button>

                      <Button
                        color="warning"
                        onClick={() => setCount(0)}
                        disabled={count === 0}
                      >
                        Reset
                      </Button>
                    </div>
                  </Column>

                  <Column size="half">
                    {showNotification && (
                      <Notification
                        color="success"
                        isLight
                        onDelete={() => setShowNotification(false)}
                      >
                        <strong>Success!</strong> Your Vite + Bestax setup is
                        working perfectly!
                      </Notification>
                    )}

                    {count > 10 && (
                      <Notification color="info" isLight mt="3">
                        You've clicked the button {count} times!
                      </Notification>
                    )}
                  </Column>
                </Columns>
              </Box>
            </Column>
          </Columns>
        </Section>
      </Container>
    </>
  );
}

export default App;
