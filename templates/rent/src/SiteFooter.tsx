import { Fragment } from 'react';
import {
  Column,
  Columns,
  Container,
  Hero,
  Link,
} from '@allxsmith/bestax-bulma';

const LINKS = ['About us', 'Our story', 'Post a listing', 'Contact us'];

/** The footer: the Bulma credit, the site links and the fine print. */
function SiteFooter() {
  return (
    <Hero as="footer" size="small" color="light">
      <Hero.Body>
        <Container textAlign="centered">
          {/* A text link where the original shows Bulma's "made with Bulma"
              badge, a trademark the port draws no copy of. */}
          <p>
            <Link
              href="https://bulma.io"
              textWeight="semibold"
              textColor="dark"
            >
              Made with Bulma
            </Link>
          </p>
          <Columns className="m-t-10">
            <Column>
              <nav className="has-text-grey-light" aria-label="Site">
                {LINKS.map(label => (
                  <Fragment key={label}>
                    <Link href="#" textColor="primary" colorShade="on-scheme">
                      {label}
                    </Link>{' '}
                    &bull;{' '}
                  </Fragment>
                ))}
              </nav>
            </Column>
          </Columns>
          <div className="b-t m-t-30 p-t-30 has-text-grey-light is-size-7">
            Rent Template 2020 &copy; aldi
            <br />
            <Link href="#" textColor="primary" colorShade="on-scheme">
              Terms of use
            </Link>{' '}
            and{' '}
            <Link href="#" textColor="primary" colorShade="on-scheme">
              Privacy policy
            </Link>
            .{' '}
            <Link href="#" textColor="primary" colorShade="on-scheme">
              Fair Housing
            </Link>
          </div>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default SiteFooter;
