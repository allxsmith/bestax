import type { ReactNode } from 'react';
import { Card, Image } from '@allxsmith/bestax-bulma';

/**
 * Every listing photo in the original is the same 640x360 placeholder, a
 * hot-link to a placeholder service, kept here as a local copy.
 */
export const PLACEHOLDER = '/media/placeholder-640x360.png';

interface ListingCardProps {
  /** The photo's alt text. */
  alt: string;
  /** The card's body: its title, and a blurb for some. */
  children: ReactNode;
}

/** A card with a 16:9 photo on top, the original's `rb-card`. */
function ListingCard({ alt, children }: ListingCardProps) {
  return (
    <Card className="rb-card">
      <Card.Image>
        <Image size="16by9" src={PLACEHOLDER} alt={alt} />
      </Card.Image>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export default ListingCard;
