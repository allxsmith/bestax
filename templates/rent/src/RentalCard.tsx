import type { ReactNode } from 'react';
import { Card, Image } from '@allxsmith/bestax-bulma';

/**
 * A grey stand-in photo like the original's, kept in public/ so the page
 * needs no placeholder service, until the listings have photos of their own.
 */
const PLACEHOLDER = '/media/placeholder.svg';

interface RentalCardProps {
  /** Describes the photo. */
  alt: string;
  /** Photo URL. */
  src?: string;
  /** The card's text, under the photo. */
  children: ReactNode;
}

/** A listing: a 16:9 photo over a title, in the original's lifted card. */
function RentalCard({ alt, src = PLACEHOLDER, children }: RentalCardProps) {
  return (
    <Card className="rb-card">
      <Card.Image>
        <Image size="16by9" src={src} alt={alt} />
      </Card.Image>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export default RentalCard;
