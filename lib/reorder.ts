export type OrderedItem = {
  id: string;
  order: number;
};

export function calculateFractionalOrder(
  previousOrder: number | null,
  nextOrder: number | null,
) {
  if (previousOrder === null && nextOrder === null) return 1;
  if (previousOrder === null) return nextOrder! - 1;
  if (nextOrder === null) return previousOrder + 1;

  return previousOrder + (nextOrder - previousOrder) / 2;
}

export function getNextOrder(items: OrderedItem[]) {
  if (items.length === 0) return 1;

  return Math.max(...items.map((item) => item.order)) + 1;
}
