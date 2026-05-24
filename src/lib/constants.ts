export const COUNTER_NAMES = [
  'Ari',
  'Misheel',
  'Erkhemee',
  'Worker1',
  'Worker2',
] as const;

export type CounterName = (typeof COUNTER_NAMES)[number];

export const COUNTER_COLORS: Record<CounterName, string> = {
  Ari:      '#ff9f0a', // orange
  Misheel:  '#30d158', // green
  Erkhemee: '#0a84ff', // blue
  Worker1:  '#bf5af2', // purple
  Worker2:  '#ff453a', // red
};

export const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

export const DISCOUNTS = [0, 50, 70] as const;
export type Discount = (typeof DISCOUNTS)[number];

// Default session — auto-created on first launch
export const DEFAULT_SESSION_ID = 'default';
export const DEFAULT_SESSION_NAME = 'Inventory Count';

export const CURRENCY = 'MNT';

// Quantity safety cap (user can override per-item)
export const QUANTITY_SOFT_CAP = 99;

// Heartbeat for presence
export const PRESENCE_HEARTBEAT_MS = 30_000;
export const PRESENCE_TIMEOUT_MS = 60_000;
