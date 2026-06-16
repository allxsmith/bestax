import * as barrel from '../useBulmaClasses';
import * as source from '../bulmaClassHelpers';
import { useColorClasses } from '../useColorClasses';
import { useSpacingClasses } from '../useSpacingClasses';
import { useTypographyClasses } from '../useTypographyClasses';
import { useVisibilityClasses } from '../useVisibilityClasses';
import { useFlexboxClasses } from '../useFlexboxClasses';
import { useOtherClasses } from '../useOtherClasses';

// useBulmaClasses.tsx is the public barrel: it re-exports the validator
// constants from bulmaClassHelpers and the per-concern mini hooks. These tests
// pin that public surface so a broken or dropped re-export is caught.
describe('useBulmaClasses public re-exports', () => {
  const validatorNames = [
    'validColors',
    'validColorShades',
    'validSizes',
    'validTextSizes',
    'validAlignments',
    'validTextTransforms',
    'validTextWeights',
    'validFontFamilies',
    'validDisplays',
    'validVisibilities',
    'validFlexDirections',
    'validFlexWraps',
    'validJustifyContents',
    'validAlignContents',
    'validAlignItems',
    'validAlignSelfs',
    'validFlexGrowShrink',
    'validViewports',
  ] as const;

  it.each(validatorNames)(
    're-exports %s identical to bulmaClassHelpers',
    name => {
      expect(barrel[name]).toBeDefined();
      expect(barrel[name]).toBe(source[name]);
    }
  );

  it('re-exports the per-concern mini hooks', () => {
    expect(barrel.useColorClasses).toBe(useColorClasses);
    expect(barrel.useSpacingClasses).toBe(useSpacingClasses);
    expect(barrel.useTypographyClasses).toBe(useTypographyClasses);
    expect(barrel.useVisibilityClasses).toBe(useVisibilityClasses);
    expect(barrel.useFlexboxClasses).toBe(useFlexboxClasses);
    expect(barrel.useOtherClasses).toBe(useOtherClasses);
  });

  it('exposes the composed useBulmaClasses hook', () => {
    expect(typeof barrel.useBulmaClasses).toBe('function');
  });
});
