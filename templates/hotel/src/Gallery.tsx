import { useSyncExternalStore } from 'react';
import {
  Card,
  Carousel,
  CarouselItem,
  Column,
  Columns,
  Container,
  Content,
  Hero,
  Image,
  Section,
  Title,
} from '@allxsmith/bestax-bulma';

const unsplash = (photo: string) =>
  `https://images.unsplash.com/photo-${photo}?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1000&q=80`;

const description = 'Ici une petite description pour tester le slider';

const photos = [
  { title: 'Mon titre 1', src: unsplash('1550921082-c282cdc432d6') },
  { title: 'Mon titre 2', src: unsplash('1550945771-515f118cef86') },
  { title: 'Mon titre 3', src: unsplash('1550971264-3f7e4a7bb349') },
  { title: 'Mon titre 4', src: unsplash('1550931937-2dfd45a40da0') },
  { title: 'Mon titre 5', src: unsplash('1550930516-af8b8cc4f871') },
];

/** Bulma's tablet breakpoint, where the slides start holding three cards. */
const TABLET = '(min-width: 769px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(TABLET);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Whether the viewport is tablet-wide or wider, kept current on resize. */
function useTabletUp() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(TABLET).matches,
    () => true
  );
}

/**
 * The photos in groups of `size`, the last group filled from the start so
 * every slide is full, as the original's looping slider shows it.
 */
function groups<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    result.push(
      Array.from(
        { length: size },
        (_, offset) => items[(start + offset) % items.length]
      )
    );
  }
  return result;
}

function PhotoCard({ title, src }: (typeof photos)[number]) {
  return (
    <Card className="gallery-card">
      <Card.Image>
        <Image size="16by9" className="gallery-photo" src={src} alt="" />
      </Card.Image>
      <Card.Content>
        <div>{title}</div>
        <div>{description}</div>
      </Card.Content>
    </Card>
  );
}

/**
 * The gallery. The original's slider shows three cards at a time, and
 * bestax's Carousel shows one slide at a time, so from tablet width up each
 * slide holds three cards, and below it one, as the original shows phones.
 */
function Gallery() {
  const perSlide = useTabletUp() ? 3 : 1;

  return (
    <Hero id="hotel-gallery">
      <Hero.Body p="0">
        <Container overflow="clipped">
          <Content>
            <Title size="4">Hotel Gallery</Title>
          </Content>
          <Section p="0">
            <Carousel
              ariaLabel="Hotel gallery"
              className="gallery-carousel"
              key={perSlide}
            >
              {groups(photos, perSlide).map(group => (
                <CarouselItem key={group.map(photo => photo.title).join()}>
                  <Columns isMobile isGapless>
                    {group.map(photo => (
                      <Column key={photo.title}>
                        <PhotoCard {...photo} />
                      </Column>
                    ))}
                  </Columns>
                </CarouselItem>
              ))}
            </Carousel>
          </Section>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Gallery;
