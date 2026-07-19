import {
  Block,
  Box,
  Button,
  Container,
  Content,
  Footer,
  Heading,
  Icon,
  Image,
  Loader,
  Notification,
  Progress,
  Section,
  Table,
  Tag,
} from 'react-bulma-components';

export function Elements() {
  return (
    <Section size="medium">
      <Container breakpoint="fluid">
        <Heading size={2} weight="bold" spaced>
          Elements
        </Heading>
        <Heading subtitle size={4}>
          Every basic piece of the page
        </Heading>
        <Heading heading>Stats</Heading>
        <Box>
          <Content size="small">
            <p>Rich text lives here.</p>
          </Content>
        </Box>
        <Block textAlign="center">
          <Button.Group align="center" hasAddons>
            <Button color="primary" size="medium" rounded outlined>
              Confirm
            </Button>
            <Button color="ghost" loading>
              Ghost
            </Button>
            <Button text state="active" submit>
              Plain
            </Button>
            <Button remove />
          </Button.Group>
        </Block>
        <Notification color="warning" light>
          Heads up — something changed.
        </Notification>
        <Progress value={45} max={100} color="info" size="small" />
        <Table.Container>
          <Table size="fullwidth" striped bordered hoverable>
            <thead>
              <tr>
                <th>Package</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>bestax-bulma</td>
                <td>5.x</td>
              </tr>
            </tbody>
          </Table>
        </Table.Container>
        <Tag.Group hasAddons>
          <Tag color="dark">npm</Tag>
          <Tag color="info" rounded>
            1.0
          </Tag>
          <Tag remove />
        </Tag.Group>
        <Icon color="success" size="medium">
          <i className="fas fa-check" />
        </Icon>
        <Icon.Text>Verified</Icon.Text>
        <Image size={128} rounded src="/avatar.png" alt="Avatar" />
        <Image size="16by9" src="/cover.png" alt="Cover" />
        <Loader />
      </Container>
      <Footer paddingless>© bestax</Footer>
    </Section>
  );
}
