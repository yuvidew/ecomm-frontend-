import type { Order } from '../types/orders'

// Placeholder order history for the UI-only "My Orders" phase -- stands in for a real
// query hook until the backend orders endpoint exists (.claude/plan/phase-18-my-orders-page.md).
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-10241',
    placedAt: '2026-09-25',
    status: 'processing',
    items: [
      { id: 'item-1', name: 'Wireless Mouse', image: null, quantity: 1, price: 799 },
      { id: 'item-2', name: 'Mechanical Keyboard', image: null, quantity: 1, price: 2499 },
    ],
    total: 3298,
  },
  {
    id: 'ORD-10198',
    placedAt: '2026-09-18',
    status: 'shipped',
    items: [{ id: 'item-3', name: 'Running Shoes', image: null, quantity: 1, price: 2999 }],
    total: 2999,
  },
  {
    id: 'ORD-10154',
    placedAt: '2026-09-10',
    status: 'delivered',
    items: [
      { id: 'item-4', name: 'Cotton T-Shirt', image: null, quantity: 2, price: 499 },
      { id: 'item-5', name: 'Denim Jacket', image: null, quantity: 1, price: 2199 },
      { id: 'item-6', name: 'Canvas Backpack', image: null, quantity: 1, price: 1599 },
    ],
    total: 4796,
  },
  {
    id: 'ORD-10103',
    placedAt: '2026-08-30',
    status: 'delivered',
    items: [{ id: 'item-7', name: 'Ceramic Coffee Mug', image: null, quantity: 1, price: 349 }],
    total: 349,
  },
  {
    id: 'ORD-10067',
    placedAt: '2026-08-15',
    status: 'cancelled',
    items: [
      { id: 'item-8', name: 'Bluetooth Speaker', image: null, quantity: 1, price: 1899 },
      { id: 'item-9', name: 'Phone Case', image: null, quantity: 1, price: 299 },
    ],
    total: 2198,
  },
]
