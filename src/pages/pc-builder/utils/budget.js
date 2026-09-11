/**
 * G-Lab PC Builder: Budget Calculation Utilities
 */

export const DEFAULT_BUDGET_PRESETS = [
  { label: 'Budget Esports', value: 150000 },
  { label: 'Mid-Tier 1440p', value: 300000 },
  { label: 'High-End Gaming', value: 450000 },
  { label: 'Ultra 4K Enthusiast', value: 700000 },
];

/**
 * Calculates current build total, remaining budget, and percent used.
 */
export function calculateBudgetStatus(parts = {}, targetBudget = 0) {
  const items = Object.entries(parts)
    .filter(([_, part]) => part && typeof part.price === 'number')
    .map(([key, part]) => ({
      slot: key,
      name: part.name,
      price: part.price,
    }));

  const currentTotal = items.reduce((sum, item) => sum + item.price, 0);
  const budget = Number(targetBudget) || 0;
  const remaining = budget > 0 ? budget - currentTotal : 0;
  const isOverBudget = budget > 0 && currentTotal > budget;
  const overAmount = isOverBudget ? currentTotal - budget : 0;
  const percentUsed = budget > 0 ? Math.min(Math.round((currentTotal / budget) * 100), 100) : 0;

  return {
    items,
    currentTotal,
    targetBudget: budget,
    remaining,
    isOverBudget,
    overAmount,
    percentUsed,
  };
}
