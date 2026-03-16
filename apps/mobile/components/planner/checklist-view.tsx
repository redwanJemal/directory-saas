import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useChecklist, useToggleTask, useDeleteTask, type ChecklistTask } from '@/hooks/api/use-checklist';
import { Skeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import { AddTaskSheet } from './add-task-sheet';

type FilterType = 'all' | 'overdue' | 'upcoming' | 'completed';

export function ChecklistView() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const { data: tasks, isLoading, refetch, isRefetching } = useChecklist(filter);
  const toggleTask = useToggleTask();

  const completedCount = tasks?.filter((task) => task.isCompleted).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('checklist.all') },
    { key: 'overdue', label: t('checklist.overdue') },
    { key: 'upcoming', label: t('checklist.upcoming') },
    { key: 'completed', label: t('checklist.completed') },
  ];

  const renderItem = useCallback(
    ({ item }: { item: ChecklistTask }) => (
      <TaskItem task={item} onToggle={toggleTask} />
    ),
    [toggleTask],
  );

  if (isLoading) {
    return (
      <View className="flex-1 px-4 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} className="mb-3 flex-row items-center rounded-card bg-surface-secondary p-3">
            <Skeleton width={24} height={24} borderRadius={12} />
            <View className="ml-3 flex-1">
              <Skeleton width="70%" height={16} />
              <Skeleton width="40%" height={12} className="mt-1" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Progress bar */}
      <View className="mx-4 mt-4">
        <Text className="mb-2 text-sm text-content-secondary">
          {t('checklist.progress', { done: completedCount, total: totalCount })}
        </Text>
        <View className="h-2 overflow-hidden rounded-full bg-surface-secondary">
          <View
            className="h-full rounded-full bg-brand-600"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>

      {/* Filter tabs */}
      <View className="mx-4 mt-3 flex-row">
        {filters.map((f) => (
          <Pressable
            key={f.key}
            className={`mr-2 rounded-full px-3 py-1.5 ${
              filter === f.key ? 'bg-brand-600' : 'bg-surface-secondary'
            }`}
            onPress={() => setFilter(f.key)}
          >
            <Text
              className={`text-xs font-medium ${
                filter === f.key ? 'text-content-inverse' : 'text-content-secondary'
              }`}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Task list */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4c6ef5" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkbox-outline"
            title={t('checklist.noTasks')}
            actionTitle={t('checklist.addTask')}
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

      <AddTaskSheet visible={showAddSheet} onClose={() => setShowAddSheet(false)} />
    </View>
  );
}

function TaskItem({
  task,
  onToggle,
}: {
  task: ChecklistTask;
  onToggle: ReturnType<typeof useToggleTask>;
}) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX(30)
    .onUpdate((e) => {
      if (e.translationX > 0 && !task.isCompleted) {
        translateX.value = Math.min(e.translationX, 100);
      }
    })
    .onEnd((e) => {
      if (e.translationX > 60 && !task.isCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onToggle.mutate({ id: task.id, isCompleted: true });
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: translateX.value / 100,
  }));

  const handleToggle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onToggle.mutate({ id: task.id, isCompleted: !task.isCompleted });
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} className="mb-2">
      <View className="overflow-hidden rounded-card">
        {/* Swipe background */}
        <Animated.View
          style={backgroundStyle}
          className="absolute inset-0 items-start justify-center rounded-card bg-success-500 px-4"
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={animatedStyle}
            className="flex-row items-center rounded-card border border-border bg-surface p-3"
          >
            {/* Checkbox */}
            <Pressable onPress={handleToggle} className="mr-3">
              <Ionicons
                name={task.isCompleted ? 'checkbox' : 'square-outline'}
                size={24}
                color={task.isCompleted ? '#40c057' : '#868e96'}
              />
            </Pressable>

            {/* Content */}
            <View className="flex-1">
              <Text
                className={`text-base ${
                  task.isCompleted
                    ? 'text-content-tertiary line-through'
                    : 'font-medium text-content'
                }`}
              >
                {task.title}
              </Text>
              <View className="mt-1 flex-row items-center">
                {task.dueDate && (
                  <Text className="mr-3 text-xs text-content-secondary">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                )}
                {task.category && (
                  <View className="rounded-full bg-surface-secondary px-2 py-0.5">
                    <Text className="text-xs capitalize text-content-secondary">
                      {task.category}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}
