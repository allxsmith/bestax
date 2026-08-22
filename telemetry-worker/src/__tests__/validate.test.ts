import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validate } from '../validate.ts';

type Payload = Record<string, unknown>;

const createPayload = (): Payload => ({
  v: 1,
  tool: 'create-bestax',
  event: 'scaffold',
  toolVersion: '1.4.2',
  nodeMajor: 22,
  platform: 'darwin',
  props: {
    template: 'vite-ts',
    bulmaFlavor: 'complete',
    iconLibrary: 'none',
    skills: true,
    packageManager: 'pnpm',
  },
});

const migratePayload = (): Payload => ({
  v: 1,
  tool: 'bestax-migrate',
  event: 'migrate',
  toolVersion: '0.3.0',
  nodeMajor: 20,
  platform: 'linux',
  props: {
    source: 'react-bulma-components',
    cssMode: 'bestax',
    dry: false,
    deps: true,
    changedBucket: '10-49',
    changedCount: 23,
  },
  todosByRule: [
    { rule: 'unmapped-prop', count: 3 },
    { rule: 'icon.size', count: 1 },
  ],
});

const props = (payload: Payload): Payload => payload.props as Payload;

const assertOk = (payload: unknown) => {
  const result = validate(payload);
  assert.equal(result.ok, true, JSON.stringify(result));
};

const assertRejected = (payload: unknown, label: string) => {
  const result = validate(payload);
  assert.equal(result.ok, false, `expected rejection: ${label}`);
};

describe('validate: accepts', () => {
  it('canonical create-bestax payload', () => {
    assertOk(createPayload());
  });

  it('canonical bestax-migrate payload with todosByRule', () => {
    assertOk(migratePayload());
  });

  it('bestax-migrate payload without todosByRule', () => {
    const payload = migratePayload();
    delete payload.todosByRule;
    assertOk(payload);
  });

  it('prerelease toolVersion', () => {
    const payload = createPayload();
    payload.toolVersion = '2.0.0-beta.1';
    assertOk(payload);
  });

  it('validated payload round-trips unchanged', () => {
    const payload = migratePayload();
    const result = validate(payload);
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.payload, payload);
  });
});

describe('validate: rejects non-objects', () => {
  for (const [label, value] of [
    ['null', null],
    ['array', []],
    ['string', 'scaffold'],
    ['number', 42],
    ['boolean', true],
  ] as const) {
    it(label, () => assertRejected(value, label));
  }
});

describe('validate: rejects unknown or missing keys', () => {
  it('unknown top-level key', () => {
    const payload = createPayload();
    payload.extra = 'nope';
    assertRejected(payload, 'unknown top-level key');
  });

  it('todosByRule on create-bestax', () => {
    const payload = createPayload();
    payload.todosByRule = [{ rule: 'x', count: 1 }];
    assertRejected(payload, 'todosByRule is migrate-only');
  });

  it('unknown props key', () => {
    const payload = createPayload();
    props(payload).ip = '203.0.113.7';
    assertRejected(payload, 'unknown props key');
  });

  for (const key of [
    'v',
    'tool',
    'event',
    'toolVersion',
    'nodeMajor',
    'platform',
    'props',
  ]) {
    it(`missing top-level ${key}`, () => {
      const payload = migratePayload();
      delete payload[key];
      assertRejected(payload, `missing ${key}`);
    });
  }

  for (const key of [
    'template',
    'bulmaFlavor',
    'iconLibrary',
    'skills',
    'packageManager',
  ]) {
    it(`missing create props.${key}`, () => {
      const payload = createPayload();
      delete props(payload)[key];
      assertRejected(payload, `missing props.${key}`);
    });
  }

  for (const key of [
    'source',
    'cssMode',
    'dry',
    'deps',
    'changedBucket',
    'changedCount',
  ]) {
    it(`missing migrate props.${key}`, () => {
      const payload = migratePayload();
      delete props(payload)[key];
      assertRejected(payload, `missing props.${key}`);
    });
  }
});

describe('validate: rejects envelope field values', () => {
  for (const v of [2, 0, '1', null]) {
    it(`v = ${JSON.stringify(v)}`, () => {
      const payload = createPayload();
      payload.v = v;
      assertRejected(payload, 'v must be 1');
    });
  }

  it('unknown tool', () => {
    const payload = createPayload();
    payload.tool = 'bestax-doctor';
    assertRejected(payload, 'unknown tool');
  });

  it('create-bestax with migrate event', () => {
    const payload = createPayload();
    payload.event = 'migrate';
    assertRejected(payload, 'wrong event for tool');
  });

  it('bestax-migrate with scaffold event', () => {
    const payload = migratePayload();
    payload.event = 'scaffold';
    assertRejected(payload, 'wrong event for tool');
  });

  for (const version of [
    '1.2',
    'v1.2.3',
    '1.2.3_beta',
    '1.2.3-',
    '1.2.3 ',
    `1.0.0-${'a'.repeat(30)}`, // > 32 chars
    123,
  ]) {
    it(`toolVersion = ${JSON.stringify(version)}`, () => {
      const payload = createPayload();
      payload.toolVersion = version;
      assertRejected(payload, 'bad toolVersion');
    });
  }

  for (const nodeMajor of [9, 100, 22.5, '22', -22]) {
    it(`nodeMajor = ${JSON.stringify(nodeMajor)}`, () => {
      const payload = createPayload();
      payload.nodeMajor = nodeMajor;
      assertRejected(payload, 'bad nodeMajor');
    });
  }

  it('unknown platform', () => {
    const payload = createPayload();
    payload.platform = 'haiku';
    assertRejected(payload, 'unknown platform');
  });

  it('props as array', () => {
    const payload = createPayload();
    payload.props = [];
    assertRejected(payload, 'props must be an object');
  });
});

describe('validate: rejects props enum values', () => {
  const badEnum: [string, () => Payload, string][] = [
    ['template', createPayload, 'template'],
    ['bulmaFlavor', createPayload, 'bulmaFlavor'],
    ['iconLibrary', createPayload, 'iconLibrary'],
    ['packageManager', createPayload, 'packageManager'],
    ['source', migratePayload, 'source'],
    ['cssMode', migratePayload, 'cssMode'],
    ['changedBucket', migratePayload, 'changedBucket'],
  ];
  for (const [label, factory, key] of badEnum) {
    it(`unknown ${label}`, () => {
      const payload = factory();
      props(payload)[key] = 'not-a-real-value';
      assertRejected(payload, `unknown ${label}`);
    });
  }

  it('bucket label as changedBucket', () => {
    const payload = migratePayload();
    props(payload).changedBucket = '1-10';
    assertRejected(payload, 'changedBucket not in bucket set');
  });

  for (const [key, factory] of [
    ['skills', createPayload],
    ['dry', migratePayload],
    ['deps', migratePayload],
  ] as const) {
    it(`non-boolean ${key}`, () => {
      const payload = factory();
      props(payload)[key] = 'true';
      assertRejected(payload, `${key} must be boolean`);
    });
  }

  for (const changedCount of [-1, 100001, 1.5, '23', null]) {
    it(`changedCount = ${JSON.stringify(changedCount)}`, () => {
      const payload = migratePayload();
      props(payload).changedCount = changedCount;
      assertRejected(payload, 'bad changedCount');
    });
  }
});

describe('validate: todosByRule', () => {
  const PRODUCTION_RULES = [
    'prop:className',
    'prop:renderAs',
    'prop:size',
    'unsupported-file',
    'peer-deps',
    'plain-element',
    'imports',
    'responsive',
    'deps',
  ] as const;

  it('more than 20 entries rejects the whole payload', () => {
    const payload = migratePayload();
    payload.todosByRule = Array.from({ length: 21 }, (_, i) => ({
      rule: `rule-${i}`,
      count: 1,
    }));
    assertRejected(payload, 'oversized todosByRule');
  });

  it('exactly 20 entries is accepted', () => {
    const payload = migratePayload();
    payload.todosByRule = Array.from({ length: 20 }, (_, i) => ({
      rule: `rule-${i}`,
      count: 1,
    }));
    assertOk(payload);
  });

  it('non-array todosByRule rejects the whole payload', () => {
    const payload = migratePayload();
    payload.todosByRule = { rule: 'x', count: 1 };
    assertRejected(payload, 'todosByRule must be an array');
  });

  it('accepts production migrate rule slugs', () => {
    const payload = migratePayload();
    payload.todosByRule = PRODUCTION_RULES.map(rule => ({ rule, count: 1 }));
    const result = validate(payload);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (result.ok && result.payload.tool === 'bestax-migrate') {
      assert.deepEqual(
        result.payload.todosByRule?.map(entry => entry.rule),
        [...PRODUCTION_RULES]
      );
    }
  });

  it('drops a bad entry and keeps the run plus good slugs', () => {
    const payload = migratePayload();
    payload.todosByRule = [
      { rule: 'prop:className', count: 2 },
      { rule: 'has space', count: 1 },
      { rule: 'x', count: 1, file: 'App.tsx' },
      { rule: 'ok-rule' },
      { rule: 'ok-rule', count: -1 },
    ];
    const result = validate(payload);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (result.ok && result.payload.tool === 'bestax-migrate') {
      assert.deepEqual(result.payload.todosByRule, [
        { rule: 'prop:className', count: 2 },
      ]);
    }
  });

  it('omits todosByRule when every entry is dropped', () => {
    const payload = migratePayload();
    payload.todosByRule = [{ rule: 'x', count: 1, file: 'App.tsx' }];
    const result = validate(payload);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (result.ok) assert.equal('todosByRule' in result.payload, false);
  });

  for (const rule of [
    '-leading-dash',
    '.leading-dot',
    '',
    'has space',
    'a'.repeat(65),
    42,
  ]) {
    it(`drops rule = ${JSON.stringify(rule)} and keeps the run`, () => {
      const payload = migratePayload();
      payload.todosByRule = [{ rule, count: 1 }];
      const result = validate(payload);
      assert.equal(result.ok, true, JSON.stringify(result));
      if (result.ok) assert.equal('todosByRule' in result.payload, false);
    });
  }

  for (const count of [-1, 100001, 0.5, '3', null]) {
    it(`drops count = ${JSON.stringify(count)} and keeps the run`, () => {
      const payload = migratePayload();
      payload.todosByRule = [{ rule: 'ok-rule', count }];
      const result = validate(payload);
      assert.equal(result.ok, true, JSON.stringify(result));
      if (result.ok) assert.equal('todosByRule' in result.payload, false);
    });
  }
});
