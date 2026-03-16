import { Component, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 items-center justify-center bg-surface px-8">
          <Ionicons name="warning-outline" size={64} color="#fa5252" />
          <Text className="mt-4 text-center text-lg font-semibold text-content">
            {i18n.t('common.error')}
          </Text>
          <Text className="mt-2 text-center text-sm text-content-secondary">
            {this.state.error?.message || ''}
          </Text>
          <Pressable
            className="mt-6 rounded-button bg-brand-600 px-6 py-3"
            onPress={this.resetError}
          >
            <Text className="font-semibold text-content-inverse">
              {i18n.t('common.retry')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
