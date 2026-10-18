import { Fragment } from 'react';
import {
  Column,
  Columns,
  Container,
  Hero,
  Link,
  Paragraph,
  Span,
} from '@allxsmith/bestax-bulma';

const links = ['About us', 'Our story', 'Post a listing', 'Contact us'];

/** The footer, with the original's credit kept where it was. */
function SiteFooter() {
  return (
    <footer>
      <Hero size="small" color="light">
        <Hero.Body>
          <Container textAlign="centered">
            <Link href="https://bulma.io">
              <img
                src="https://bulma.io/assets/images/made-with-bulma.png"
                alt="Made with Bulma"
                width={171}
                height={32}
              />
            </Link>
            <Columns mt="2">
              <Column>
                <nav aria-label="Footer">
                  <Span textColor="grey-light">
                    {links.map(link => (
                      <Fragment key={link}>
                        <Link href="#" textColor="primary">
                          {link}
                        </Link>{' '}
                        &bull;{' '}
                      </Fragment>
                    ))}
                  </Span>
                </nav>
              </Column>
            </Columns>
            {/* `b-t` is the original's rule above the small print. */}
            <Paragraph
              className="b-t"
              mt="5"
              pt="5"
              textColor="grey-light"
              textSize="7"
            >
              Rent Template 2020 &copy; aldi
              <br />
              <Link href="#" textColor="primary">
                Terms of use
              </Link>{' '}
              and{' '}
              <Link href="#" textColor="primary">
                Privacy policy
              </Link>
              .{' '}
              <Link href="#" textColor="primary">
                Fair Housing
              </Link>
            </Paragraph>
          </Container>
        </Hero.Body>
      </Hero>
    </footer>
  );
}

export default SiteFooter;
