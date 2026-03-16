export interface BudgetSummaryData {
  totalBudget: number;
  spent: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  estimated: number;
  actual: number;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  name: string;
  estimated: number;
  actual: number;
  paid: number;
  vendor?: string;
  notes?: string;
}
