import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useBudgetOverview, type BudgetCategory } from '@/hooks/api/use-budget';
import { Skeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import { AddExpenseSheet } from './add-expense-sheet';

const CHART_COLORS = [
  '#bac8ff',
  '#91a7ff',
  '#748ffc',
  '#5c7cfa',
  '#4c6ef5',
  '#4263eb',
  '#3b5bdb',
  '#364fc7',
];

export function BudgetView() {
  const { t } = useTranslation();
  const { data: budget, isLoading, refetch, isRefetching } = useBudgetOverview();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (isLoading) {
    return (
      <View className="flex-1 px-4 pt-4">
        <Skeleton height={120} borderRadius={12} width="100%" />
        <Skeleton height={200} borderRadius={12} width="100%" className="mt-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={60} borderRadius={12} width="100%" className="mt-3" />
        ))}
      </View>
    );
  }

  if (!budget) {
    return (
      <EmptyState
        icon="wallet-outline"
        title={t('budget.noExpenses')}
        actionTitle={t('budget.addExpense')}
        onAction={() => setShowAddSheet(true)}
      />
    );
  }

  const spentPercent = budget.totalBudget > 0
    ? Math.min((budget.totalSpent / budget.totalBudget) * 100, 100)
    : 0;
  const isOverBudget = budget.remaining < 0;

  return (
    <View className="flex-1">
      <FlatList
        data={budget.categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4c6ef5" />
        }
        ListHeaderComponent={
          <>
            {/* Budget header */}
            <View className="mb-4 rounded-card border border-border bg-surface p-4">
              <Text className="text-sm text-content-secondary">{t('budget.totalBudget')}</Text>
              <Text className="mt-1 text-3xl font-bold text-content">
                {formatCurrency(budget.totalBudget)}
              </Text>

              {/* Progress bar */}
              <View className="mt-3 h-3 overflow-hidden rounded-full bg-surface-secondary">
                <View
                  className={`h-full rounded-full ${isOverBudget ? 'bg-danger-500' : 'bg-brand-600'}`}
                  style={{ width: `${spentPercent}%` }}
                />
              </View>

              <View className="mt-2 flex-row justify-between">
                <View>
                  <Text className="text-xs text-content-secondary">{t('budget.spent')}</Text>
                  <Text className="text-base font-semibold text-content">
                    {formatCurrency(budget.totalSpent)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-content-secondary">{t('budget.remaining')}</Text>
                  <Text
                    className={`text-base font-semibold ${
                      isOverBudget ? 'text-danger-500' : 'text-success-500'
                    }`}
                  >
                    {formatCurrency(Math.abs(budget.remaining))}
                  </Text>
                </View>
              </View>
            </View>

            {/* Simple pie chart using View circles */}
            {budget.categories.length > 0 && (
              <View className="mb-4 rounded-card border border-border bg-surface p-4">
                <Text className="mb-3 text-sm font-semibold text-content">
                  {t('budget.category')}
                </Text>
                {budget.categories.map((cat, index) => {
                  const percent =
                    budget.totalSpent > 0
                      ? ((cat.spentAmount / budget.totalSpent) * 100).toFixed(1)
                      : '0.0';
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <View key={cat.id} className="mb-2 flex-row items-center">
                      <View
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <Text className="flex-1 text-sm text-content">{cat.name}</Text>
                      <Text className="mr-2 text-sm text-content-secondary">{percent}%</Text>
                      <Text className="text-sm font-medium text-content">
                        {formatCurrency(cat.spentAmount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <CategoryCard
            category={item}
            color={CHART_COLORS[index % CHART_COLORS.length]}
            isExpanded={expandedCategory === item.id}
            onToggle={() =>
              setExpandedCategory((prev) => (prev === item.id ? null : item.id))
            }
            formatCurrency={formatCurrency}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title={t('budget.noExpenses')}
            actionTitle={t('budget.addExpense')}
            onAction={() => setShowAddSheet(true)}
          />
        }
      />

      {/* Add button */}
      <Pressable
        className="absolute bottom-6 right-4 h-14 w-14 items-center justify-center rounded-full bg-brand-600 shadow-lg"
        onPress={() => setShowAddSheet(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <AddExpenseSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        categories={budget.categories}
      />
    </View>
  );
}

function CategoryCard({
  category,
  color,
  isExpanded,
  onToggle,
  formatCurrency,
}: {
  category: BudgetCategory;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  formatCurrency: (amount: number) => string;
}) {
  const percent =
    category.estimatedAmount > 0
      ? Math.min((category.spentAmount / category.estimatedAmount) * 100, 100)
      : 0;
  const isOver = category.spentAmount > category.estimatedAmount;

  return (
    <Pressable
      className="mb-2 rounded-card border border-border bg-surface p-3"
      onPress={onToggle}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <Text className="text-base font-medium text-content">{category.name}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#868e96"
        />
      </View>

      {/* Progress */}
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-sm text-content-secondary">
          {formatCurrency(category.spentAmount)} / {formatCurrency(category.estimatedAmount)}
        </Text>
      </View>
      <View className="mt-1 h-2 overflow-hidden rounded-full bg-surface-secondary">
        <View
          className={`h-full rounded-full ${isOver ? 'bg-danger-500' : 'bg-brand-600'}`}
          style={{ width: `${percent}%`, backgroundColor: isOver ? undefined : color }}
        />
      </View>

      {/* Expanded items */}
      {isExpanded && category.items.length > 0 && (
        <View className="mt-3 border-t border-border pt-3">
          {category.items.map((item) => (
            <View key={item.id} className="mb-2 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm text-content">{item.description}</Text>
                {item.vendorName && (
                  <Text className="text-xs text-content-secondary">{item.vendorName}</Text>
                )}
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-sm font-medium text-content">
                  {formatCurrency(item.amount)}
                </Text>
                <Ionicons
                  name={item.isPaid ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={item.isPaid ? '#40c057' : '#868e96'}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
