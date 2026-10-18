import { Button, Column, Columns, Footer, Paragraph } from "@allxsmith/bestax-bulma";

export default function FragmentPage() {
  // TODO(bestax-migrate): `.message` stays as markup: bestax `Message` always wraps its children in `.message-body`
  return (
    <>
      <Columns isMobile>
        <Column size="half">
          <Button as="a" color="primary" size="large" href="/signup">Sign up</Button>
          <Paragraph textAlign="centered" mt="4">No card needed</Paragraph>
        </Column>
        <Column>
          <article className="message is-info">
            <div className="message-body">Questions? Ask us anything.</div>
          </article>
        </Column>
      </Columns>
      <Footer>
        <Paragraph textColor="grey">Made with Bulma</Paragraph>
      </Footer>
    </>
  );
}
