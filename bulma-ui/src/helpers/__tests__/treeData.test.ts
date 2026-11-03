import type { TreeItemData } from '../../form/TreeSelect';
import {
  checkRecords,
  checkedByStrategy,
  indexTree,
  isParentNode,
  nodeLabel,
  searchTree,
} from '../treeData';

const TREE: TreeItemData[] = [
  {
    value: 'a',
    label: 'A',
    children: [
      { value: 'a1', label: 'A1' },
      { value: 'a2', label: 'A2', disabled: true },
      {
        value: 'a3',
        label: 'A3',
        children: [{ value: 'a3x', label: 'A3x' }],
      },
    ],
  },
  { value: 'b', label: 'B', hasChildren: true },
  { value: 'c', label: '' },
];

const records = checkRecords(indexTree(TREE));

describe('indexTree', () => {
  it('lists every node by value in reading order, with the values above it', () => {
    const index = indexTree(TREE);
    expect(Array.from(index.keys())).toEqual([
      'a',
      'a1',
      'a2',
      'a3',
      'a3x',
      'b',
      'c',
    ]);
    expect(index.get('a3x')!.path).toEqual(['a', 'a3']);
    expect(index.get('a')!.path).toEqual([]);
  });

  it('keeps the first node with a value', () => {
    const index = indexTree([
      { value: 'x', label: 'First' },
      { value: 'y', children: [{ value: 'x', label: 'Second' }] },
    ]);
    expect(index.get('x')!.node.label).toBe('First');
  });
});

describe('nodeLabel and isParentNode', () => {
  it('names a node by its label, or its value when that is empty', () => {
    expect(nodeLabel(TREE[0])).toBe('A');
    expect(nodeLabel(TREE[2])).toBe('c');
    expect(nodeLabel({ value: 'd' })).toBe('d');
  });

  it('counts children, or hasChildren, as a parent', () => {
    expect(isParentNode(TREE[0])).toBe(true);
    expect(isParentNode(TREE[1])).toBe(true);
    expect(isParentNode({ value: 'e', children: [] })).toBe(false);
    expect(isParentNode(TREE[2])).toBe(false);
  });
});

describe('checkRecords', () => {
  it('records each node as TreeView does', () => {
    expect(records.get('a2')).toEqual({
      parent: 'a',
      disabled: true,
      isParent: false,
    });
    expect(records.get('b')).toEqual({
      parent: null,
      disabled: false,
      isParent: true,
    });
  });
});

describe('checkedByStrategy', () => {
  it.each([
    ['child', ['a1', 'a3x']],
    ['parent', ['a']],
    ['all', ['a', 'a1', 'a3', 'a3x']],
  ] as const)("'%s' of a checked branch is %j", (strategy, expected) => {
    expect(checkedByStrategy(records, ['a'], strategy)).toEqual(expected);
  });

  it('keeps a checked disabled item in every list, and round-trips', () => {
    for (const strategy of ['child', 'parent', 'all'] as const) {
      const list = checkedByStrategy(records, ['a', 'a2'], strategy);
      expect(list).toContain('a2');
      expect(checkedByStrategy(records, list, strategy)).toEqual(list);
      expect(checkedByStrategy(records, list, 'all')).toEqual([
        'a',
        'a1',
        'a2',
        'a3',
        'a3x',
      ]);
    }
  });

  it('reports an unloaded parent as a leaf, and a mixed parent not at all', () => {
    expect(checkedByStrategy(records, ['b', 'a1'], 'child')).toEqual([
      'a1',
      'b',
    ]);
    expect(checkedByStrategy(records, ['a1'], 'parent')).toEqual(['a1']);
  });

  it('keeps values no node has at the end, once each', () => {
    expect(checkedByStrategy(records, ['z', 'a1', 'z'], 'all')).toEqual([
      'a1',
      'z',
    ]);
  });
});

describe('searchTree', () => {
  const match = (text: string) => (node: TreeItemData) =>
    nodeLabel(node).includes(text);

  it("keeps a match, its ancestors and what's under it, and opens the branches above", () => {
    const found = searchTree(TREE, match('A3x'));
    expect(found.found).toBe(true);
    expect(found.open).toEqual(['a3', 'a']);
    expect(Array.from(found.hidden)).toEqual(['a1', 'a2', 'b', 'c']);
    expect(searchTree(TREE, match('A3')).hidden.has('a3x')).toBe(false);
  });

  it('hands each node its path from the top down, the node last', () => {
    const paths: string[] = [];
    searchTree(TREE, (node, path) => {
      expect(path[path.length - 1]).toBe(node);
      paths.push(path.map(step => step.value).join('/'));
      return false;
    });
    expect(paths).toEqual(['a', 'a/a1', 'a/a2', 'a/a3', 'a/a3/a3x', 'b', 'c']);
  });

  it('hides everything when nothing matches', () => {
    const found = searchTree(TREE, () => false);
    expect(found.found).toBe(false);
    expect(found.open).toEqual([]);
    expect(found.hidden.size).toBe(7);
  });
});
