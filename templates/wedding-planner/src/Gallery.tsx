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

const unsplash = (photo: string, size: string) =>
  `https://images.unsplash.com/photo-${photo}?ixlib=rb-1.2.1&auto=format&fit=crop&${size}`;

const description = 'Ici une petite description pour tester le slider';

const photos = [
  {
    title: 'Mon titre 1',
    src: unsplash('1425421543490-6a133856ff32', 'w=500&q=60'),
  },
  {
    title: 'Mon titre 2',
    src: unsplash('1520342868574-5fa3804e551c', 'w=500&q=60'),
  },
  {
    title: 'Mon titre 3',
    src: unsplash('1504993945773-3f38e1b6a626', 'w=1350&q=80'),
  },
  {
    title: 'Mon titre 4',
    src: unsplash('1506072328856-cd6629b00b62', 'w=1350&q=80'),
  },
  {
    title: 'Mon titre 5',
    src: unsplash('1444920275954-9dddec6b714e', 'w=500&q=60'),
  },
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
    <Hero id="hotel-gallery" className="gallery">
      <Hero.Body p="0">
        <Container overflow="clipped">
          <Content>
            <Title textAlign="centered">Weddings Gallery</Title>
          </Content>
          <Section p="0">
            <Carousel
              ariaLabel="Weddings gallery"
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
