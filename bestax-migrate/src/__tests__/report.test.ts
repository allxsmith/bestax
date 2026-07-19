import { Reporter } from '../report.js';

describe('Reporter', () => {
  it('tracks files, changes, and todos', () => {
    const reporter = new Reporter();
    const collector = reporter.startFile();
    collector.add({
      file: 'a.tsx',
      line: 3,
      rule: 'prop:x',
      message: 'convert x',
    });
    collector.add({
      file: 'a.tsx',
      line: 9,
      rule: 'responsive',
      message: 'flatten',
    });
    reporter.finishFile('a.tsx', true, collector.entries);
    reporter.finishFile('b.tsx', false, []);

    expect(reporter.files).toHaveLength(2);
    expect(reporter.changedCount).toBe(1);
    expect(reporter.todos).toHaveLength(2);
  });

  it('groups todos by rule, most frequent first', () => {
    const reporter = new Reporter();
    const collector = reporter.startFile();
    collector.add({
      file: 'a.tsx',
      line: 1,
      rule: 'responsive',
      message: 'one',
    });
    collector.add({
      file: 'a.tsx',
      line: 2,
      rule: 'responsive',
      message: 'two',
    });
    collector.add({ file: 'a.tsx', line: 3, rule: 'prop:x', message: 'three' });
    reporter.finishFile('a.tsx', true, collector.entries);

    const grouped = reporter.todosByRule();
    expect(grouped.map(g => g.rule)).toEqual(['responsive', 'prop:x']);
    expect(grouped[0].entries).toHaveLength(2);
  });

  it('renders a summary with counts and locations', () => {
    const reporter = new Reporter();
    const collector = reporter.startFile();
    collector.add({
      file: 'a.tsx',
      line: 3,
      rule: 'prop:x',
      message: 'convert x',
    });
    collector.add({
      file: 'b.tsx',
      line: null,
      rule: 'css',
      message: 'swap css',
    });
    reporter.finishFile('a.tsx', true, collector.entries);

    const text = reporter.render('label');
    expect(text).toContain('label');
    expect(text).toContain('1 file(s) scanned');
    expect(text).toContain('a.tsx:3');
    expect(text).toContain('b.tsx — swap css');
    expect(text).toContain('TODO(bestax-migrate)');
  });

  it('renders a quiet summary when nothing was found', () => {
    const reporter = new Reporter();
    reporter.finishFile('a.tsx', false, []);
    const text = reporter.render('label');
    expect(text).toContain('0');
    expect(text).not.toContain('Search for');
  });
});
