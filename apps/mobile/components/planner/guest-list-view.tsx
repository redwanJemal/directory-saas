import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useGuests, useGuestSummary, useDeleteGuest, type Guest } from '@/hooks/api/use-guests';
import { Skeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import { StatCard } from '@/components/stat-card';
import { AddGuestSheet } from './add-guest-sheet';

export function GuestListView() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const { data: guests, isLoading, refetch, isRefetching } = useGuests(search || undefined);
  const { data: summary } = useGuestSummary();
  const deleteGuest = useDeleteGuest();

  const handleDelete = useCallback(
    (guest: Guest) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(
        t('common.confirm'),
        t('common.delete') + ` "${guest.name}"?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => deleteGuest.mutate(guest.id),
          },
        ],
      );
    },
    [deleteGuest, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: Guest }) => (
      <GuestItem guest={item} onDelete={handleDelete} />
    ),
    [handleDelete],
  );

  if (isLoading) {
    return (
      <View className="flex-1 px-4 pt-4">
        <View className="mb-4 flex-row gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} className="flex-1">
              <Skeleton height={70} borderRadius={12} width="100%" />
            </View>
          ))}
        </View>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} className="mb-3 rounded-card bg-surface-secondary p-3">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} className="mt-1" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* RSVP Summary */}
      {summary && (
        <View className="mx-4 mt-4 flex-row gap-2">
          <StatCard
            icon="checkmark-circle"
            iconColor="#40c057"
            label={t('guests.attending')}
            value={summary.attending}
          />
          <StatCard
            icon="close-circle"
            iconColor="#fa5252"
            label={t('guests.declined')}
            value={summary.declined}
          />
          <StatCard
            icon="time"
            iconColor="#fab005"
            label={t('guests.pending')}
            value={summary.pending}
          />
        </View>
      )}

      {/* Search */}
      <View className="mx-4 mt-3 flex-row items-center rounded-input border border-border bg-surface px-3 py-2">
        <Ionicons name="search" size={18} color="#868e96" />
        <TextInput
          className="ml-2 flex-1 text-base text-content"
          placeholder={t('common.search')}
          placeholderTextColor="#868e96"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#868e96" />
          </Pressable>
        )}
      </View>

      {/* Total count */}
      {summary && (
        <Text className="mx-4 mt-2 text-sm text-content-secondary">
          {t('guests.totalGuests', { count: summary.total })}
        </Text>
      )}

      {/* Guest list */}
      <FlatList
        data={guests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4c6ef5" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('guests.noGuests')}
            actionTitle={t('guests.addGuest')}
            onAction={() => setShowAddSheet(true)}
          />
        }
      />

      {/* Add button */}
      <Pressable
        className="absolute bottom-6 right-4 h-14 w-14 items-center justify-center rounded-full bg-brand-600 shadow-lg"
        onPress={() => setShowAddSheet(true)}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
      </Pressable>

      <AddGuestSheet visible={showAddSheet} onClose={() => setShowAddSheet(false)} />
    </View>
  );
}

function GuestItem({
  guest,
  onDelete,
}: {
  guest: Guest;
  onDelete: (guest: Guest) => void;
}) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX(-30)
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -100);
      }
    })
    .onEnd((e) => {
      if (e.translationX < -60) {
        onDelete(guest);
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: Math.abs(translateX.value) / 100,
  }));

  const statusColors: Record<string, { bg: string; text: string }> = {
    attending: { bg: 'bg-success-50', text: 'text-success-700' },
    declined: { bg: 'bg-danger-50', text: 'text-danger-700' },
    pending: { bg: 'bg-warning-50', text: 'text-warning-700' },
  };

  const statusStyle = statusColors[guest.rsvpStatus] ?? statusColors.pending;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} className="mb-2">
      <View className="overflow-hidden rounded-card">
        {/* Swipe background (delete) */}
        <Animated.View
          style={backgroundStyle}
          className="absolute inset-0 items-end justify-center rounded-card bg-danger-500 px-4"
        >
          <Ionicons name="trash" size={24} color="#fff" />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={animatedStyle}
            className="flex-row items-center rounded-card border border-border bg-surface p-3"
          >
            {/* Avatar placeholder */}
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <Text className="text-base font-bold text-brand-600">
                {guest.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text className="text-base font-medium text-content">{guest.name}</Text>
              <Text className="mt-0.5 text-xs capitalize text-content-secondary">
                {guest.relationship}
              </Text>
            </View>

            {/* RSVP Status badge */}
            <View className={`rounded-full px-2.5 py-1 ${statusStyle.bg}`}>
              <Text className={`text-xs font-medium capitalize ${statusStyle.text}`}>
                {guest.rsvpStatus}
              </Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}
