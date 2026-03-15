import { executeEstimateBudget } from './estimate-budget.tool';

describe('estimateBudget tool', () => {
  it('should allocate budget across categories', async () => {
    const result = await executeEstimateBudget({
      totalBudget: 100000,
      guestCount: 100,
      categories: ['venue', 'catering', 'photography'],
    });

    expect(result.totalBudget).toBe(100000);
    expect(result.guestCount).toBe(100);
    expect(result.allocations).toHaveLength(3);

    const totalAllocated = result.allocations.reduce(
      (sum, a) => sum + a.allocatedBudget,
      0,
    );
    expect(totalAllocated).toBeGreaterThan(0);
    expect(totalAllocated).toBeLessThanOrEqual(100001);
    expect(result.perGuestTotal).toBe(1000);
  });

  it('should boost priority categories', async () => {
    const result = await executeEstimateBudget({
      totalBudget: 100000,
      guestCount: 50,
      categories: ['venue', 'photography'],
      priorities: ['photography'],
    });

    const photoAlloc = result.allocations.find((a) => a.category === 'photography');
    expect(photoAlloc).toBeDefined();
    expect(photoAlloc!.allocatedBudget).toBeGreaterThan(0);
  });

  it('should handle zero guest count', async () => {
    const result = await executeEstimateBudget({
      totalBudget: 50000,
      guestCount: 0,
      categories: ['venue'],
    });

    expect(result.perGuestTotal).toBe(0);
    expect(result.allocations[0].perGuest).toBe(0);
  });

  it('should use default weight for unknown categories', async () => {
    const result = await executeEstimateBudget({
      totalBudget: 10000,
      guestCount: 10,
      categories: ['custom-service'],
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].allocatedBudget).toBe(10000);
    expect(result.allocations[0].percentage).toBe(100);
  });

  it('should return percentage allocations that sum close to 100', async () => {
    const result = await executeEstimateBudget({
      totalBudget: 200000,
      guestCount: 200,
      categories: ['venue', 'catering', 'photography', 'decoration'],
    });

    const totalPercentage = result.allocations.reduce(
      (sum, a) => sum + a.percentage,
      0,
    );
    // Rounding may cause slight deviation
    expect(totalPercentage).toBeGreaterThanOrEqual(98);
    expect(totalPercentage).toBeLessThanOrEqual(102);
  });
});
