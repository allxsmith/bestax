import React, { useState, useEffect } from 'react';
import * as BestaxBulma from '@allxsmith/bestax-bulma';
import { ProfileCard } from '@site/src/components/SkillExamples';
import SmartTheme from './ShadowTheme';
import { DOCS_ONLY_NAMES, REACT_SCOPE_NAMES } from './sandbox/scope-names.mjs';

/**
 * What a live example can use without importing it.
 *
 * Split into its parts because the StackBlitz and CodeSandbox buttons need to
 * know where each name comes from: library exports and React hooks become
 * imports in the generated project, and a docs-only component cannot go
 * there at all, so an example using one shows no sandbox buttons.
 */

/** Picks exactly the named values, so a listed name without a value fails here. */
function pick(values, names) {
  return Object.fromEntries(
    names.map(name => {
      if (!(name in values)) {
        throw new Error(
          `${name} is listed in scope-names.mjs but has no value in scope.js`
        );
      }
      return [name, values[name]];
    })
  );
}

const reactScope = pick({ useState, useEffect }, REACT_SCOPE_NAMES);
const docsOnlyScope = pick({ ProfileCard }, DOCS_ONLY_NAMES);

export const reactScopeNames = REACT_SCOPE_NAMES;
export const docsOnlyNames = DOCS_ONLY_NAMES;

export const scope = {
  ...BestaxBulma,
  Theme: SmartTheme, // Override with our smart Theme selector
  ...docsOnlyScope,
  React,
  ...reactScope,
};
