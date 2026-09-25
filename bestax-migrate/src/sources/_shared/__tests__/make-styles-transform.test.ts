import { makeStylesTransform } from '../make-styles-transform.js';

describe('makeStylesTransform without a source package', () => {
  const transformStyles = makeStylesTransform({
    guideUrl: 'https://bestax.io/docs/guides/getting-started/migration',
    rootStylesheetSuffixes: [],
  });

  it('leaves a stylesheet that never mentions Bulma alone', () => {
    const source = "$gap: 1rem;\n@import 'theme/base';\n";
    expect(transformStyles('app.scss', source, undefined, {})).toBeNull();
  });

  it('still rewrites the Bulma 0.9 import it does find', () => {
    const output = transformStyles(
      'app.scss',
      "$primary: #ff6b35;\n@import 'bulma/bulma';\n",
      undefined,
      {}
    );
    expect(output).toContain("@use 'bulma/sass' with (");
    expect(output).toContain('$primary: #ff6b35');
  });
});
