// Skill example (frozen snapshot) — the ProfileCard produced by following
// skills/bestax-custom-component. DOCS-ONLY copy so it can render in live code
// blocks; NOT shipped in @allxsmith/bestax-bulma. Composes the library's
// Image/Title/SubTitle/Content. Styles: ./profilecard.css (also injected into
// the live-preview shadow DOM via ShadowPreview/shadowStyles.js).
import React, { forwardRef } from 'react';
import {
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  Image,
  Title,
  SubTitle,
  Content,
} from '@allxsmith/bestax-bulma';

export const ProfileCard = forwardRef(
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
