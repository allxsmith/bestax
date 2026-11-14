// INTERNAL: deliberately not exported from src/index.ts.
import React from 'react';
import { Icon } from '../elements/Icon';

/**
 * What a component's `icon` prop renders: a string is an `Icon` name, and
 * anything else renders as it is. Check that the prop was given with
 * `isGiven` first.
 *
 * @param icon - The `icon` prop.
 * @returns An `Icon` for a string, else `icon` itself.
 */
export const iconNode = (icon: React.ReactNode) =>
  typeof icon === 'string' ? <Icon name={icon} /> : icon;
