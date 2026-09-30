/**
 * The items a programmatic container shows at one place on the screen.
 */
export interface PositionStack<Item, Position extends string> {
  /**
   * A React key for the stack. The stack at the container's own position
   * keeps the same key whatever that position is, so changing the container's
   * `position` moves the items in it instead of remounting them.
   */
  key: string;
  /** Where on the screen the stack sits. */
  position: Position;
  /** The items at that position, in the order they were shown. */
  items: Item[];
}

/**
 * Splits the items a container shows into one stack per position in use. An
 * item goes to its own position when it has one and to the container's
 * otherwise. A position with no items gets no stack.
 *
 * Stacks come back in `order`, so their order in the page follows the screen
 * rather than which position happened to be used first, and a stack keeps its
 * place while the others come and go. A position missing from `order` sorts
 * after the known ones.
 *
 * @function groupIntoPositionStacks
 * @param items - The items the container shows, in the order they were shown.
 * @param positionOf - Reads an item's own position, if it has one.
 * @param containerPosition - Where an item without a position of its own goes.
 * @param order - Every known position, in the order stacks should render.
 * @returns One stack per position in use.
 */
export function groupIntoPositionStacks<Item, Position extends string>(
  items: readonly Item[],
  positionOf: (item: Item) => Position | undefined,
  containerPosition: Position,
  order: readonly Position[]
): PositionStack<Item, Position>[] {
  const byPosition = new Map<Position, Item[]>();
  for (const item of items) {
    const position = positionOf(item) ?? containerPosition;
    const stack = byPosition.get(position);
    if (stack) {
      stack.push(item);
    } else {
      byPosition.set(position, [item]);
    }
  }

  const rank = (position: Position) => {
    const index = order.indexOf(position);
    return index === -1 ? order.length : index;
  };

  // Array.prototype.sort is stable, so unknown positions keep the order they
  // were first used in.
  return Array.from(byPosition, ([position, stackItems]) => ({
    key: position === containerPosition ? 'container' : `at-${position}`,
    position,
    items: stackItems,
  })).sort((a, b) => rank(a.position) - rank(b.position));
}
