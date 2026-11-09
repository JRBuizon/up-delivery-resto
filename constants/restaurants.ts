// constants/restaurants.ts
// Mirrors the customer app's CATEGORIES (minus 'All', which is only a filter there).

export const CATEGORIES = ['Rice Meals', 'Snacks', 'Coffee', 'Milk Tea', 'Healthy'];

export const PRICE_RANGES = [
  { value: '₱', label: '₱ — Budget (under ₱100)' },
  { value: '₱₱', label: '₱₱ — Mid (₱100–₱200)' },
  { value: '₱₱₱', label: '₱₱₱ — Premium (₱200+)' },
];

export const DELIVERY_TIMES = ['10-20 min', '15-25 min', '20-30 min', '30-45 min'];

export const DEFAULT_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80';
