import * as IndexExports from '../index';

describe('index.ts', () => {
  it('exports Button component', () => {
    expect(IndexExports.Button).toBeDefined();
    expect(typeof IndexExports.Button).toBe('function');
  });

  it('has expected export names', () => {
    const exportNames = Object.keys(IndexExports);
    expect(exportNames).toContain('Button');
  });
});
