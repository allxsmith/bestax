import { Content, SubTitle, Title } from '@allxsmith/bestax-bulma';

/**
 * The name, the job and the description. The heading is the page's `<h1>`
 * at Bulma's size 2: `Title`'s `size` would pick an `<h2>` too, so the size
 * is the `textSize` helper.
 */
function Intro() {
  return (
    <>
      <Title textSize="2" textWeight="medium" className="name">
        Hi, I’m Kate Woodman
      </Title>
      <SubTitle as="p" textColor="grey" className="job">
        Web Designer &amp; Developer
      </SubTitle>
      <hr className="hr" />
      <Content textColor="grey" textAlign="justified" className="description">
        <p className="text">
          As a passionate web designer and developer with over 5 years of
          experience, I specialize in creating beautiful, functional, and
          user-centered digital experiences. My approach combines clean code
          with innovative design solutions.
        </p>
        <p className="text">
          I’ve successfully delivered projects for clients ranging from startups
          to established enterprises, focusing on responsive design, performance
          optimization, and accessibility. My expertise includes modern frontend
          frameworks, UI/UX best practices, and creative problem-solving.
        </p>
        <p className="text">
          Currently based in San Francisco, I’m always excited to take on new
          challenges and collaborate on projects that push creative boundaries
          while delivering real business value.
        </p>
      </Content>
    </>
  );
}

export default Intro;
