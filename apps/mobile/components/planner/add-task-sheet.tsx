import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTask } from '@/hooks/api/use-checklist';

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'venue',
  'catering',
  'photography',
  'music',
  'flowers',
  'attire',
  'invitations',
  'transportation',
  'other',
];

export function AddTaskSheet({ visible, onClose }: AddTaskSheetProps) {
  const { t } = useTranslation();
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = t('errors.validationError');
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        dueDate: dueDate || undefined,
        category: category || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetAndClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setDueDate('');
    setCategory('');
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-3xl bg-surface pb-8">
          {/* Handle bar */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-lg font-bold text-content">{t('checklist.addTask')}</Text>
            <Pressable onPress={resetAndClose}>
              <Ionicons name="close" size={24} color="#495057" />
            </Pressable>
          </View>

          <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
            <Input
              label={t('checklist.taskName')}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder={t('checklist.taskName')}
              error={errors.title}
            />

            <Input
              label={t('checklist.dueDate')}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
            />

            {/* Category selector */}
            <Text className="mb-1.5 text-sm font-medium text-content">
              {t('budget.category')}
            </Text>
            <View className="mb-4 flex-row flex-wrap">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() => setCategory(isSelected ? '' : cat)}
                  >
                    <Text
                      className={`text-sm capitalize ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View className="px-4 pt-3">
            <Button
              title={t('checklist.addTask')}
              onPress={handleSubmit}
              loading={createTask.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
