import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChecklistView } from '@/components/planner/checklist-view';
import { GuestListView } from '@/components/planner/guest-list-view';
import { BudgetView } from '@/components/planner/budget-view';
import { MessagesView } from '@/components/planner/messages-view';

type PlannerTab = 'checklist' | 'guests' | 'budget' | 'messages';

export default function PlannerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PlannerTab>('checklist');

  const tabs: { key: PlannerTab; label: string }[] = [
    { key: 'checklist', label: t('planner.checklist') },
    { key: 'guests', label: t('planner.guests') },
    { key: 'budget', label: t('planner.budget') },
    { key: 'messages', label: t('planner.messages') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Text className="px-4 pt-4 text-2xl font-bold text-content">
        {t('planner.title')}
      </Text>

      {/* Segmented control */}
      <View className="mx-4 mt-4 flex-row rounded-button bg-surface-secondary p-1">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            className={`flex-1 rounded-button py-2 ${
              activeTab === tab.key ? 'bg-brand-600' : ''
            }`}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              className={`text-center text-xs font-medium ${
                activeTab === tab.key ? 'text-content-inverse' : 'text-content-secondary'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'checklist' && <ChecklistView />}
      {activeTab === 'guests' && <GuestListView />}
      {activeTab === 'budget' && <BudgetView />}
      {activeTab === 'messages' && <MessagesView />}
    </SafeAreaView>
  );
}
