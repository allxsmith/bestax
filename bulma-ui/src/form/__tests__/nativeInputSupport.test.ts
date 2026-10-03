import { supportsInputType } from '../_pickerInternals/nativeInputSupport';

describe('supportsInputType', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reports a type the browser implements', () => {
    expect(supportsInputType('month')).toBe(true);
  });

  it('reports a type the browser reads back as text', () => {
    expect(supportsInputType('not-a-type')).toBe(false);
  });

  it('works each type out once', () => {
    const createElement = jest.spyOn(document, 'createElement');
    expect(supportsInputType('week')).toBe(true);
    expect(supportsInputType('week')).toBe(true);
    expect(createElement).toHaveBeenCalledTimes(1);
  });
});
