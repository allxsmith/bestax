// Skill example (frozen snapshot) — a custom component produced by following
// skills/bestax-custom-component. It demonstrates the "check existing first" step:
// there's no ProfileCard in the library, but Card/Image/Title/SubTitle/Content
// exist, so this NEW component COMPOSES the existing elements and adds its own
// layout SCSS (./profilecard.scss, Storybook-only — not shipped in the package).
import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Image, Title, SubTitle, Content } from '../index';

export interface ProfileCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'color'>,
    BulmaClassesProps {
  /** Person's name (rendered as the title). */
  name: string;
  /** Role / subtitle line under the name. */
  role?: string;
  /** Avatar image URL. */
  imageSrc: string;
  /** Alt text for the avatar (defaults to the name). */
  imageAlt?: string;
}

/**
 * ProfileCard — avatar on top, then name, role, and a description. Composes the
 * existing Image/Title/SubTitle/Content elements.
 *
 * @example
 * <ProfileCard name="Ada Lovelace" role="Mathematician" imageSrc="/ada.jpg">
 *   Wrote the first algorithm intended for a machine.
 * </ProfileCard>
 */
export const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ name, role, imageSrc, imageAlt, className, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const cardClass = usePrefixedClassNames('profile-card');
    const imageClass = usePrefixedClassNames('profile-card-image');
    const bodyClass = usePrefixedClassNames('profile-card-body');
    const combined = classNames(cardClass, bulmaHelperClasses, className);

    return (
      <div ref={ref} className={combined} {...rest}>
        <div className={imageClass}>
          <Image
            size="128x128"
            src={imageSrc}
            alt={imageAlt ?? name}
            isRounded
          />
        </div>
        <div className={bodyClass}>
          <Title size="4" as="h3">
            {name}
          </Title>
          {role && (
            <SubTitle size="6" as="p">
              {role}
            </SubTitle>
          )}
          {children && <Content>{children}</Content>}
        </div>
      </div>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
