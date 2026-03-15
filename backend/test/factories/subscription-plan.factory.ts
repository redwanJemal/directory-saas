import { PrismaClient } from '@prisma/client';
import { randomId } from './utils';

export interface SubscriptionPlanFactoryInput {
  name?: string;
  displayName?: string;
  description?: string | null;
  priceMonthly?: number;
  priceYearly?: number;
  maxUsers?: number;
  maxStorage?: number;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Creates a plain subscription plan data object (no DB interaction).
 * Use for unit tests with mocked dependencies.
 */
export function createSubscriptionPlanFactory(
  overrides?: SubscriptionPlanFactoryInput,
) {
  const id = randomId();
  return {
    id: `plan-${id}`,
    name: `plan-${id}`,
    displayName: `Test Plan ${id}`,
    description: null,
    priceMonthly: 49,
    priceYearly: 490,
    maxUsers: 25,
    maxStorage: 10240,
    features: ['basic-features'],
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a subscription plan in the test database and returns it.
 * Use for E2E / integration tests.
 */
export async function createSubscriptionPlanDbFactory(
  prisma: PrismaClient,
  overrides?: SubscriptionPlanFactoryInput,
) {
  const id = randomId();
  return prisma.subscriptionPlan.create({
    data: {
      name: overrides?.name || `plan-${id}`,
      displayName: overrides?.displayName || `Test Plan ${id}`,
      description: overrides?.description ?? null,
      priceMonthly: overrides?.priceMonthly ?? 49,
      priceYearly: overrides?.priceYearly ?? 490,
      maxUsers: overrides?.maxUsers ?? 25,
      maxStorage: overrides?.maxStorage ?? 10240,
      features: overrides?.features ?? ['basic-features'],
      isActive: overrides?.isActive ?? true,
      sortOrder: overrides?.sortOrder ?? 0,
    },
  });
}
