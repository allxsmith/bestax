import { Fragment } from 'react';
import {
  Column,
  Columns,
  Container,
  Paragraph,
  Title,
} from '@allxsmith/bestax-bulma';

const text =
  'Scelerisque fermentum dui faucibus in ornare quam viverra orci. Ultricies mi quis hendrerit dolor. Aliquet lectus proin nibh nisl condimentum. Sit amet dictum sit amet justo donec. Iaculis eu non diam phasellus vestibulum lorem.';

/**
 * The steps, each an illustration beside its text, on alternating sides: the
 * text comes first in the odd steps and the picture in the even ones, so on a
 * phone, where the columns stack, the order follows the markup as it does in
 * the original. `wide` art takes 70% of its column, the rest 50%.
 */
const steps = [
  { title: 'Step one', art: '/img/step-agreement.svg', wide: true },
  { title: 'Step two', art: '/img/step-gown.svg' },
  { title: 'Step three', art: '/img/step-album.svg', wide: true },
  { title: 'Step four', art: '/img/step-celebration.svg' },
];

/** The features section the "Learn more" button scrolls to. */
function Steps() {
  return (
    <section id="features">
      {steps.map((step, index) => {
        const textFirst = index % 2 === 0;
        const copy = (
          <Column>
            <Title>{step.title}</Title>
            <Paragraph textColor="black">{text}</Paragraph>
          </Column>
        );
        const art = (
          <Column>
            <img
              src={step.art}
              alt=""
              className={step.wide ? 'step-art-wide' : 'step-art'}
            />
          </Column>
        );
        return (
          <Fragment key={step.title}>
            <Container>
              <Columns>
                {textFirst ? copy : art}
                {textFirst ? art : copy}
              </Columns>
            </Container>
            {/* Two line breaks after the first and third steps, as in the
                original. */}
            {textFirst && (
              <>
                <br />
                <br />
              </>
            )}
          </Fragment>
        );
      })}
    </section>
  );
}

export default Steps;
