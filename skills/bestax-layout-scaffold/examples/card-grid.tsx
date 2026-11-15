// Card grid / catalog page — a collection of similar items.
// `<Columns isMultiline>` wraps cards onto new rows; the responsive column sizes
// give 1 card per row on mobile, 2 on tablet, 3 on desktop.
// Equal heights: each Column is a flex container and its Card grows to fill
// it (flexGrow="1"), so short blurbs don't leave ragged card bottoms.
// (`height: 100%` on the card would NOT work — it resolves against auto
// height. For uniform grids, Grid/Cell gives equal heights for free.)
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

// Each `image` is a photo the app serves itself (in a Vite app, a file under
// `public/images/products/`). Replace these paths with your own pictures.
// Don't point `image` at a placeholder or stock-photo service: what it
// serves can change or disappear, and nothing records whose photo it is.
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Aurora Lamp',
    price: '$48',
    image: '/images/products/aurora-lamp.jpg',
    blurb: 'Warm ambient light.',
  },
  {
    id: 2,
    name: 'Drift Chair',
    price: '$220',
    image: '/images/products/drift-chair.jpg',
    blurb: 'Ergonomic and airy.',
  },
  {
    id: 3,
    name: 'Stone Mug',
    price: '$18',
    image: '/images/products/stone-mug.jpg',
    blurb: 'Hand-thrown ceramic.',
  },
  {
    id: 4,
    name: 'Field Notebook',
    price: '$12',
    image: '/images/products/field-notebook.jpg',
    blurb: 'Pocket-sized, lined.',
  },
  {
    id: 5,
    name: 'Trail Bottle',
    price: '$26',
    image: '/images/products/trail-bottle.jpg',
    blurb: 'Insulated steel.',
  },
  {
    id: 6,
    name: 'Linen Throw',
    price: '$64',
    image: '/images/products/linen-throw.jpg',
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
