// Skill example (frozen snapshot) — the component produced by following
// skills/bestax-custom-component. This is a DOCS-ONLY copy so it can render in
// live code blocks; it is NOT shipped in @allxsmith/bestax-bulma. Its styles
// live in ./ribbon.css (also injected into the live-preview shadow DOM via
// src/components/ShadowPreview/shadowStyles.js).
import React, { forwardRef } from 'react';
import {
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
} from '@allxsmith/bestax-bulma';

export const Ribbon = forwardRef(
  ({ color, size, className, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const mainClasses = usePrefixedClassNames('ribbon', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
    });
    const combined = classNames(mainClasses, bulmaHelperClasses, className);
    return (
      <span ref={ref} className={combined} {...rest}>
        {children}
      </span>
    );
  }
);

Ribbon.displayName = 'Ribbon';

export default Ribbon;
