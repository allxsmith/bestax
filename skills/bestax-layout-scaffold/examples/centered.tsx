// Centered single-column page — auth, settings, focused forms.
// A narrow column is centered with `<Columns isCentered>`; on mobile the column
// becomes full width automatically.
import {
  Section,
  Container,
  Columns,
  Column,
  Box,
  Title,
  SubTitle,
  Input,
  PasswordInput,
  Button,
} from '@allxsmith/bestax-bulma';

export default function LoginPage() {
  return (
    <Section>
      <Container>
        <Columns isCentered>
          <Column
            size="half"
            sizeTablet="two-thirds"
            sizeDesktop="half"
            sizeWidescreen="one-third"
          >
            <Box>
              <Title size="4" textAlign="centered">
                Sign in
              </Title>
              <SubTitle size="6" textAlign="centered" textColor="grey">
                Welcome back
              </SubTitle>
              <Input
                label="Email"
                type="email"
                autoComplete="username"
                iconLeftName="envelope"
                placeholder="you@example.com"
              />
              <PasswordInput label="Password" iconLeftName="lock" />
              <Button color="primary" isFullwidth mt="4">
                Sign in
              </Button>
            </Box>
          </Column>
        </Columns>
      </Container>
    </Section>
  );
}
