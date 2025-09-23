import type { Meta, StoryObj } from '@storybook/react';
import Hero from './Hero';
import Navbar from '../components/Navbar';
import Tabs from '../components/Tabs';
import Title from '../elements/Title';
import SubTitle from '../elements/SubTitle';
import Container from '../layout/Container';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';

const meta: Meta<typeof Hero> = {
  title: 'Layout/Hero',
  component: Hero,
};

export default meta;

// Default story
export const Default: StoryObj<typeof Hero> = {
  render: () => (
    <Hero>
      <Hero.Body>
        <Container>
          <Title>Hero title</Title>
          <SubTitle>Hero subtitle</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

// Colors stories
export const Link: StoryObj<typeof Hero> = {
  name: 'Link',
  render: () => (
    <Hero color="link">
      <Hero.Body>
        <Container>
          <Title>Hero title (link)</Title>
          <SubTitle>Hero subtitle (link)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const Primary: StoryObj<typeof Hero> = {
  name: 'Primary',
  render: () => (
    <Hero color="primary">
      <Hero.Body>
        <Container>
          <Title>Hero title (primary)</Title>
          <SubTitle>Hero subtitle (primary)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const Info: StoryObj<typeof Hero> = {
  name: 'Info',
  render: () => (
    <Hero color="info">
      <Hero.Body>
        <Container>
          <Title>Hero title (info)</Title>
          <SubTitle>Hero subtitle (info)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const Success: StoryObj<typeof Hero> = {
  name: 'Success',
  render: () => (
    <Hero color="success">
      <Hero.Body>
        <Container>
          <Title>Hero title (success)</Title>
          <SubTitle>Hero subtitle (success)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const Warning: StoryObj<typeof Hero> = {
  name: 'Warning',
  render: () => (
    <Hero color="warning">
      <Hero.Body>
        <Container>
          <Title>Hero title (warning)</Title>
          <SubTitle>Hero subtitle (warning)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const Danger: StoryObj<typeof Hero> = {
  name: 'Danger',
  render: () => (
    <Hero color="danger">
      <Hero.Body>
        <Container>
          <Title>Hero title (danger)</Title>
          <SubTitle>Hero subtitle (danger)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

// Sizes stories
export const Small: StoryObj<typeof Hero> = {
  name: 'Small',
  render: () => (
    <Hero color="info" size="small">
      <Hero.Body>
        <Container>
          <Title>Hero title (small)</Title>
          <SubTitle>Hero subtitle (small)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const Medium: StoryObj<typeof Hero> = {
  name: 'Medium',
  render: () => (
    <Hero color="primary" size="medium">
      <Hero.Body>
        <Container>
          <Title>Hero title (medium)</Title>
          <SubTitle>Hero subtitle (medium)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const Large: StoryObj<typeof Hero> = {
  name: 'Large',
  render: () => (
    <Hero color="success" size="large">
      <Hero.Body>
        <Container>
          <Title>Hero title (large)</Title>
          <SubTitle>Hero subtitle (large)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

export const FullHeight: StoryObj<typeof Hero> = {
  name: 'FullHeight',
  render: () => (
    <Hero color="danger" size="fullheight">
      <Hero.Body>
        <Container>
          <Title>Hero title (fullheight)</Title>
          <SubTitle>Hero subtitle (fullheight)</SubTitle>
        </Container>
      </Hero.Body>
    </Hero>
  ),
};

// FullHeight with Navbar story
export const FullHeightWithNavbar: StoryObj<typeof Hero> = {
  name: 'FullHeight with Navbar',
  render: () => (
    <>
      <Navbar>
        <Container>
          <Navbar.Menu id="navMenu">
            <Navbar.Start>
              <Navbar.Item as="a">Getting Started</Navbar.Item>
              <Navbar.Item as="a">APIs</Navbar.Item>
              <Navbar.Item as="a">Blog</Navbar.Item>
            </Navbar.Start>
            <Navbar.End>
              <Navbar.Item as="span">
                <div className="buttons">
                  <Button color="primary" isInverted as="a">
                    Github
                  </Button>
                </div>
              </Navbar.Item>
            </Navbar.End>
          </Navbar.Menu>
        </Container>
      </Navbar>
      <Hero color="link" fullheightWithNavbar>
        <Hero.Body>
          <Container>
            <Title>Fullheight with navbar</Title>
          </Container>
        </Hero.Body>
      </Hero>
    </>
  ),
};

// FullHeight with Head, Body, Foot story
export const FullHeightWithHeadBodyFoot: StoryObj<typeof Hero> = {
  name: 'FullHeight with Head, Body, Foot',
  render: () => (
    <Hero color="primary" size="medium">
      <Hero.Head>
        <Navbar>
          <Container>
            <Navbar.Brand>
              <Navbar.Item as="a">
                <img
                  src="https://bulma.io/assets/images/bulma-type-white.png"
                  alt="Logo"
                />
              </Navbar.Item>
              <span className="navbar-burger" data-target="navbarMenuHeroA">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </Navbar.Brand>
            <Navbar.Menu id="navbarMenuHeroA">
              <Navbar.End>
                <Navbar.Item as="a" active>
                  Getting Started
                </Navbar.Item>
                <Navbar.Item as="a">APIs</Navbar.Item>
                <Navbar.Item as="a">Blog</Navbar.Item>
                <Navbar.Item as="span">
                  <Button color="primary" isInverted as="a">
                    <Icon
                      library="fa"
                      name="github"
                      variant="brands"
                      ariaLabel="github"
                    />
                    <span>Github</span>
                  </Button>
                </Navbar.Item>
              </Navbar.End>
            </Navbar.Menu>
          </Container>
        </Navbar>
      </Hero.Head>

      <Hero.Body>
        <Container className="has-text-centered">
          <Title>Bestax</Title>
          <SubTitle>A Bulma Component Library</SubTitle>
        </Container>
      </Hero.Body>

      <Hero.Foot>
        <Tabs>
          <Container>
            <Tabs.List>
              <Tabs.Item>
                <a>Elements</a>
              </Tabs.Item>
              <Tabs.Item>
                <a>Components</a>
              </Tabs.Item>
              <Tabs.Item>
                <a>Columns</a>
              </Tabs.Item>
              <Tabs.Item>
                <a>Grid</a>
              </Tabs.Item>
              <Tabs.Item>
                <a>Layout</a>
              </Tabs.Item>
            </Tabs.List>
          </Container>
        </Tabs>
      </Hero.Foot>
    </Hero>
  ),
};
