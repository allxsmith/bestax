import React, { useState, useEffect } from 'react';
import * as BestaxBulma from '@allxsmith/bestax-bulma';
import { ProfileCard } from '@site/src/components/SkillExamples';
import SmartTheme from './ShadowTheme';

/**
 * What a live example can use without importing it.
 *
 * Split into its parts because the StackBlitz and CodeSandbox buttons need to
 * know where each name comes from: library exports and React hooks become
 * imports in the generated project, and a docs-only component cannot go
 * there at all, so an example using one shows no sandbox buttons.
 */

/** React exports the scope provides bare, beside `React` itself. */
const reactScope = { useState, useEffect };

/** Components that exist only in this site. No sandbox can install them. */
const docsOnlyScope = { ProfileCard };

export const reactScopeNames = Object.keys(reactScope);
export const docsOnlyNames = Object.keys(docsOnlyScope);

export const scope = {
  ...BestaxBulma,
  Theme: SmartTheme, // Override with our smart Theme selector
  ...docsOnlyScope,
  React,
  ...reactScope,
};
