import { groupIntoPositionStacks } from '../positionStacks';

type Position = 'top' | 'middle' | 'bottom';
interface Item {
  id: string;
  position?: Position;
}

const order: readonly Position[] = ['top', 'middle', 'bottom'];
const positionOf = (item: Item) => item.position;

describe('groupIntoPositionStacks', () => {
  it('returns no stacks when there are no items', () => {
    expect(
      groupIntoPositionStacks<Item, Position>([], positionOf, 'top', order)
    ).toEqual([]);
  });

  it("puts an item at its own position, or the container's without one", () => {
    const a = { id: 'a', position: 'bottom' as const };
    const b = { id: 'b' };

    const stacks = groupIntoPositionStacks<Item, Position>(
      [a, b],
      positionOf,
      'middle',
      order
    );

    expect(stacks.map(s => [s.position, s.items])).toEqual([
      ['middle', [b]],
      ['bottom', [a]],
    ]);
  });

  it('keeps items in the order they were shown within a stack', () => {
    const items = [
      { id: 'a', position: 'top' as const },
      { id: 'b' },
      { id: 'c', position: 'top' as const },
      { id: 'd' },
    ];

    const stacks = groupIntoPositionStacks<Item, Position>(
      items,
      positionOf,
      'bottom',
      order
    );

    expect(stacks.map(s => [s.position, s.items.map(i => i.id)])).toEqual([
      ['top', ['a', 'c']],
      ['bottom', ['b', 'd']],
    ]);
  });

  it('orders stacks by `order`, with unknown positions after in first-use order', () => {
    // An untyped caller can pass a position the container doesn't know.
    const items = [
      { id: 'a', position: 'sideways' },
      { id: 'b', position: 'bottom' },
      { id: 'c', position: 'upside-down' },
      { id: 'd', position: 'top' },
    ] as unknown as Item[];

    const stacks = groupIntoPositionStacks<Item, Position>(
      items,
      positionOf,
      'middle',
      order
    );

    expect(stacks.map(s => s.position)).toEqual([
      'top',
      'bottom',
      'sideways',
      'upside-down',
    ]);
  });

  it("keys the container's own stack the same whatever its position", () => {
    const items: Item[] = [{ id: 'a' }, { id: 'b', position: 'bottom' }];

    const atTop = groupIntoPositionStacks(items, positionOf, 'top', order);
    const atMiddle = groupIntoPositionStacks(
      items,
      positionOf,
      'middle',
      order
    );

    expect(atTop.map(s => [s.position, s.key])).toEqual([
      ['top', 'container'],
      ['bottom', 'at-bottom'],
    ]);
    expect(atMiddle.map(s => [s.position, s.key])).toEqual([
      ['middle', 'container'],
      ['bottom', 'at-bottom'],
    ]);
  });
});
