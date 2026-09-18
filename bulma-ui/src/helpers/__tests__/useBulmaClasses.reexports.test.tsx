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
  // DERIVED from the source module, not listed. A hardcoded allowlist only
  // ever asserts barrel ⊇ list, so a tuple added to bulmaClassHelpers reached
  // the `./constants` subpath automatically, missed the package root, and left
  // every gate green. Reading the module's own exports is what closes that:
  // the two surfaces are now the same set by construction.
  // `Extract` rather than plain `keyof`, because the source module also
  // exports `createBulmaClassHelpers` and `cursorClasses`, which the barrel
  // deliberately does not re-export. Typing the names this way also makes a
  // missing re-export a typecheck error here, not only a failing case.
  type ValidatorName = Extract<keyof typeof source, `valid${string}`>;
  const validatorNames = Object.keys(source).filter(
    (name): name is ValidatorName => name.startsWith('valid')
  );

  it('finds the validator constants to check', () => {
    // Guard against the derivation itself going quiet. If the filter stops
    // matching, every case below vanishes and the suite passes having checked
    // nothing — the failure mode a derived list trades for a stale one.
    expect(validatorNames.length).toBeGreaterThan(10);
  });

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
