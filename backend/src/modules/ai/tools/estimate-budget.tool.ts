import { z } from 'zod';

export const estimateBudgetParametersSchema = z.object({
  totalBudget: z.number().describe('Total event budget in local currency'),
  guestCount: z.number().describe('Expected number of guests'),
  categories: z
    .array(z.string())
    .describe('Service categories needed (e.g. venue, catering, photography)'),
  priorities: z
    .array(z.string())
    .optional()
    .describe('Priority areas to allocate more budget to'),
});

export type EstimateBudgetParameters = z.infer<typeof estimateBudgetParametersSchema>;

const DEFAULT_WEIGHTS: Record<string, number> = {
  venue: 0.30,
  catering: 0.25,
  photography: 0.12,
  videography: 0.08,
  decoration: 0.10,
  entertainment: 0.08,
  flowers: 0.05,
  transportation: 0.02,
};

const DEFAULT_WEIGHT = 0.10;
const PRIORITY_BOOST = 1.3;

export async function executeEstimateBudget(params: EstimateBudgetParameters) {
  const { totalBudget, guestCount, categories, priorities } = params;
  const prioritySet = new Set(
    (priorities ?? []).map((p) => p.toLowerCase()),
  );

  const rawWeights = categories.map((cat) => {
    const key = cat.toLowerCase();
    let weight = DEFAULT_WEIGHTS[key] ?? DEFAULT_WEIGHT;
    if (prioritySet.has(key)) {
      weight *= PRIORITY_BOOST;
    }
    return { category: cat, weight };
  });

  const totalWeight = rawWeights.reduce((sum, w) => sum + w.weight, 0);

  const allocations = rawWeights.map(({ category, weight }) => {
    const fraction = weight / totalWeight;
    const allocated = Math.round(totalBudget * fraction);
    const perGuest = guestCount > 0 ? Math.round(allocated / guestCount) : 0;
    return {
      category,
      allocatedBudget: allocated,
      percentage: Math.round(fraction * 100),
      perGuest,
    };
  });

  return {
    totalBudget,
    guestCount,
    allocations,
    perGuestTotal:
      guestCount > 0 ? Math.round(totalBudget / guestCount) : 0,
  };
}

export function createEstimateBudgetTool() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tool } = require('ai');
  return tool({
    description:
      'Suggest budget allocation across service categories based on total budget and guest count',
    inputSchema: estimateBudgetParametersSchema,
    execute: executeEstimateBudget,
  });
}
