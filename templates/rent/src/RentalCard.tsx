import type { ReactNode } from 'react';
import { Card, Image } from '@allxsmith/bestax-bulma';

/** The original's stand-in photo, until the listings have their own. */
const PLACEHOLDER = 'https://via.placeholder.com/640x360';

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
