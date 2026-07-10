// StatCard — the app-side worked example for the bestax-custom-component skill.
// (The library-contributor counterpart is Dialog, in references/patterns.md.)
//
// Context: an app depending on @allxsmith/bestax-bulma (e.g. `npm create bestax`).
// Everything imports from the package; no monorepo wiring, no Sass pipeline.
//
// It demonstrates the two lowest rungs of the styling ladder:
//   Rung 1 — composition + helper props only (StatCard): Box/Title/Icon plus
//            flexbox and spacing helper props. No CSS written at all.
//   Rung 2 — a small scoped CSS file consuming --bulma-* variables (the
//            commented block at the bottom) for the one thing helper props
//            can't do (an accent border), keeping Theme + dark mode working.
import type React from 'react';
import {
  Box,
  Title,
  Icon,
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Metric label, e.g. "Active users". */
  label: string;
  /** The headline value, e.g. "12,481". */
  value: string;
  /** Icon name (Font Awesome by default), e.g. "users". */
  icon?: string;
  /** Bulma color for the icon + accent. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

export function StatCard({
  label,
  value,
  icon,
  color = 'primary',
  className,
  ...props
}: StatCardProps) {
  // The library's own spine, via public exports: helper props in, classes out.
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('statcard', {
    [`is-${color}`]: !!color,
  });

  return (
    <Box
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      // Rung 1: layout entirely with helper props — no style={{}}, no CSS.
      display="flex"
      alignItems="center"
      p="4"
      {...rest}
    >
      {icon && (
        <Icon
          name={icon}
          size="large"
          textColor={color}
          mr="4"
          ariaLabel={`${label} icon`}
        />
      )}
      {/* No `gap` helper exists — space siblings with margin props (mr above). */}
      <div>
        <Title size="6" textColor="grey" mb="1">
          {label}
        </Title>
        <Title size="3" mb="0">
          {value}
        </Title>
      </div>
    </Box>
  );
}

// Rung 2 (optional) — src/components/StatCard.css, imported from this file:
//
//   .statcard {
//     /* Component-scoped custom props initialized from Bulma tokens, so any
//        ancestor (or <Theme>) can re-theme the card by overriding them. */
//     --statcard-accent: var(--bulma-primary);
//     --statcard-radius: var(--bulma-radius);
//     border-left: 0.25rem solid var(--statcard-accent);
//     border-radius: var(--statcard-radius);
//   }
//   .statcard.is-success { --statcard-accent: var(--bulma-success); }
//   .statcard.is-danger  { --statcard-accent: var(--bulma-danger);  }
//
// Only --bulma-*-derived values — never literal colors — so dark mode and
// Theme overrides keep working. Caveat: if the app uses the prefixed CSS
// flavor / ConfigProvider classPrefix, usePrefixedClassNames renders
// `bestax-statcard`; adjust the selectors (or use plain classNames).
