// Card grid / catalog page — a collection of similar items.
// `<Columns isMultiline>` wraps cards onto new rows; the responsive column sizes
// give 1 card per row on mobile, 2 on tablet, 3 on desktop.
// Equal heights: each Column is a flex container and its Card grows to fill
// it (flexGrow="1"), so short blurbs don't leave ragged card bottoms.
// (`height: 100%` on the card would NOT work — it resolves against auto
// height. For uniform grids, Grid/Cell gives equal heights for free.)
import React from 'react';
import {
  Section,
  Container,
  Title,
  Columns,
  Column,
  Card,
} from '@allxsmith/bestax-bulma';

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  blurb: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Aurora Lamp',
    price: '$48',
    image: 'https://picsum.photos/seed/1/600/400',
    blurb: 'Warm ambient light.',
  },
  {
    id: 2,
    name: 'Drift Chair',
    price: '$220',
    image: 'https://picsum.photos/seed/2/600/400',
    blurb: 'Ergonomic and airy.',
  },
  {
    id: 3,
    name: 'Stone Mug',
    price: '$18',
    image: 'https://picsum.photos/seed/3/600/400',
    blurb: 'Hand-thrown ceramic.',
  },
  {
    id: 4,
    name: 'Field Notebook',
    price: '$12',
    image: 'https://picsum.photos/seed/4/600/400',
    blurb: 'Pocket-sized, lined.',
  },
  {
    id: 5,
    name: 'Trail Bottle',
    price: '$26',
    image: 'https://picsum.photos/seed/5/600/400',
    blurb: 'Insulated steel.',
  },
  {
    id: 6,
    name: 'Linen Throw',
    price: '$64',
    image: 'https://picsum.photos/seed/6/600/400',
    blurb: 'Soft, breathable.',
  },
];

export default function CatalogPage() {
  return (
    <Section>
      <Container>
        <Title size="3" mb="5">
          Catalog
        </Title>
        <Columns isMultiline>
          {PRODUCTS.map(product => (
            <Column
              key={product.id}
              sizeMobile="full"
              sizeTablet="half"
              sizeDesktop="one-third"
              display="flex"
              flexDirection="column"
            >
              <Card
                flexGrow="1"
                image={product.image}
                imageAlt={product.name}
                header={product.name}
                // Card wraps each footer item in .card-footer-item itself —
                // no raw span/className needed (and a literal class would
                // break under ConfigProvider classPrefix).
                footer={product.price}
              >
                <p>{product.blurb}</p>
              </Card>
            </Column>
          ))}
        </Columns>
      </Container>
    </Section>
  );
}
