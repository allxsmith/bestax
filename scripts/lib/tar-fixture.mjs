/**
 * Archives built member by member, for the tests that run a publish
 * workflow's unpack step.
 */

/**
 * A ustar archive of `entries`, built here so a test can hold members that
 * tar would not write from a real tree, such as `../` names.
 */
export function tarball(entries) {
  const blocks = [];
  for (const {
    name,
    type = '0',
    body = '',
    mode = 0o644,
    link = '',
  } of entries) {
    const data = Buffer.from(body);
    const header = Buffer.alloc(512);
    const put = (offset, size, text) => header.write(text, offset, size);
    put(0, 100, name);
    put(100, 8, `${mode.toString(8).padStart(7, '0')}\0`);
    put(108, 8, '0000000\0');
    put(116, 8, '0000000\0');
    put(124, 12, `${data.length.toString(8).padStart(11, '0')}\0`);
    put(136, 12, '00000000000\0');
    put(148, 8, ' '.repeat(8));
    put(156, 1, type);
    put(157, 100, link);
    put(257, 8, 'ustar\u000000');
    const sum = header.reduce((total, byte) => total + byte, 0);
    put(148, 8, `${sum.toString(8).padStart(6, '0')}\0 `);
    blocks.push(header, data, Buffer.alloc(-data.length & 511));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}
