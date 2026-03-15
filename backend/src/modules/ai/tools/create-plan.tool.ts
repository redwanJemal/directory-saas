import { z } from 'zod';

export const createPlanParametersSchema = z.object({
  eventType: z.string().describe('Type of event (e.g. wedding, corporate, birthday)'),
  date: z.string().optional().describe('Event date in YYYY-MM-DD format'),
  guestCount: z.number().describe('Expected number of guests'),
  totalBudget: z.number().describe('Total event budget in local currency'),
  selectedProviders: z
    .array(
      z.object({
        providerId: z.string(),
        category: z.string(),
        allocatedBudget: z.number(),
      }),
    )
    .describe('Selected providers with budget allocations'),
});

export type CreatePlanParameters = z.infer<typeof createPlanParametersSchema>;

export async function executeCreatePlan(params: CreatePlanParameters) {
  const { eventType, date, guestCount, totalBudget, selectedProviders } = params;

  const allocatedTotal = selectedProviders.reduce(
    (sum, p) => sum + p.allocatedBudget,
    0,
  );

  return {
    eventType,
    date: date ?? 'TBD',
    guestCount,
    budget: {
      total: totalBudget,
      allocated: allocatedTotal,
      remaining: totalBudget - allocatedTotal,
    },
    providers: selectedProviders.map((p) => ({
      providerId: p.providerId,
      category: p.category,
      allocatedBudget: p.allocatedBudget,
    })),
    timeline: [
      { phase: 'Planning', description: 'Finalize vendors and contracts', weeksBeforeEvent: 12 },
      { phase: 'Booking', description: 'Confirm all provider bookings', weeksBeforeEvent: 8 },
      { phase: 'Coordination', description: 'Detailed planning with providers', weeksBeforeEvent: 4 },
      { phase: 'Final Check', description: 'Final walkthrough and confirmations', weeksBeforeEvent: 1 },
      { phase: 'Event Day', description: 'Execute the plan', weeksBeforeEvent: 0 },
    ],
    status: 'draft',
  };
}

export function createPlanTool() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tool } = require('ai');
  return tool({
    description:
      'Create a structured event plan with timeline, provider recommendations, and budget breakdown',
    inputSchema: createPlanParametersSchema,
    execute: executeCreatePlan,
  });
}
