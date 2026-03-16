import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateExpense, type BudgetCategory } from '@/hooks/api/use-budget';

interface AddExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
}

export function AddExpenseSheet({ visible, onClose, categories }: AddExpenseSheetProps) {
  const { t } = useTranslation();
  const createExpense = useCreateExpense();
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!categoryId) newErrors.categoryId = t('errors.validationError');
    if (!description.trim()) newErrors.description = t('errors.validationError');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = t('errors.validationError');
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createExpense.mutateAsync({
        categoryId,
        description: description.trim(),
        amount: Number(amount),
        vendorName: vendorName.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetAndClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const resetAndClose = () => {
    setCategoryId('');
    setDescription('');
    setAmount('');
    setVendorName('');
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-3xl bg-surface pb-8">
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-lg font-bold text-content">{t('budget.addExpense')}</Text>
            <Pressable onPress={resetAndClose}>
              <Ionicons name="close" size={24} color="#495057" />
            </Pressable>
          </View>

          <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
            {/* Category selector */}
            <Text className="mb-1.5 text-sm font-medium text-content">
              {t('budget.category')}
            </Text>
            <View className="mb-4 flex-row flex-wrap">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() => {
                      setCategoryId(cat.id);
                      if (errors.categoryId)
                        setErrors((prev) => ({ ...prev, categoryId: '' }));
                    }}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.categoryId && (
              <Text className="-mt-2 mb-2 text-sm text-danger-500">{errors.categoryId}</Text>
            )}

            <Input
              label={t('budget.description')}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description)
                  setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder={t('budget.description')}
              error={errors.description}
            />

            <Input
              label={t('budget.amount')}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount}
            />

            <Input
              label={t('budget.vendorName')}
              value={vendorName}
              onChangeText={setVendorName}
              placeholder={t('budget.vendorName')}
            />
          </ScrollView>

          <View className="px-4 pt-3">
            <Button
              title={t('budget.addExpense')}
              onPress={handleSubmit}
              loading={createExpense.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
