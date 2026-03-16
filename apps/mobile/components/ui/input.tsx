import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { forwardRef } from 'react';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <View className="mb-4">
        <Text className="mb-1.5 text-sm font-medium text-content">
          {label}
        </Text>
        <TextInput
          ref={ref}
          className={`rounded-input border px-4 py-3 text-base text-content ${
            error ? 'border-danger-500' : 'border-border'
          } bg-surface`}
          placeholderTextColor="#868e96"
          {...props}
        />
        {error && (
          <Text className="mt-1 text-sm text-danger-500">{error}</Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';
