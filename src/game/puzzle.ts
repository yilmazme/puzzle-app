export type Level = {
  id: number;
  // short side x long side of the grid
  short: number;
  long: number;
};

export const LEVELS: Level[] = [
  { id: 1, short: 2, long: 4 }, // 8 pieces
  { id: 2, short: 3, long: 4 }, // 12
  { id: 3, short: 4, long: 4 }, // 16
  { id: 4, short: 4, long: 5 }, // 20
  { id: 5, short: 5, long: 5 }, // 25
  { id: 6, short: 5, long: 6 }, // 30
  { id: 7, short: 6, long: 6 }, // 36
  { id: 8, short: 6, long: 7 }, // 42
];

export const pieceCount = (level: Level) => level.short * level.long;

export function gridFor(level: Level, imageAspect: number) {
  const landscape = imageAspect > 1;
  return landscape
    ? { cols: level.long, rows: level.short }
    : { cols: level.short, rows: level.long };
}

// order[slot] = id of the piece currently sitting in that slot; piece id i belongs in slot i.
export function solvedOrder(cols: number, rows: number): number[] {
  return Array.from({ length: cols * rows }, (_, i) => i);
}

export function isSolved(order: number[]): boolean {
  return order.every((piece, slot) => piece === slot);
}

export function swapSlots(order: number[], a: number, b: number): number[] {
  const next = order.slice();
  next[a] = order[b];
  next[b] = order[a];
  return next;
}

// Fisher-Yates shuffle, retried until no piece starts in its correct slot.
export function shuffledOrder(cols: number, rows: number): number[] {
  const n = cols * rows;
  for (;;) {
    const order = solvedOrder(cols, rows);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.every((piece, slot) => piece !== slot)) return order;
  }
}