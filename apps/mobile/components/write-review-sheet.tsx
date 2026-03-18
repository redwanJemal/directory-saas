import { View, Text, Pressable, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useWriteReview } from '@/hooks/api/use-reviews';
import { haptics } from '@/lib/haptics';
import { Button } from '@/components/ui/button';

interface WriteReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
}

export function WriteReviewSheet({ visible, onClose, vendorId, vendorName }: WriteReviewSheetProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const writeReview = useWriteReview();

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('reviews.ratingRequired'));
      return;
    }
    if (comment.trim().length < 10) {
      Alert.alert(t('reviews.commentMinLength'));
      return;
    }

    try {
      await writeReview.mutateAsync({
        providerId: vendorId,
        rating,
        comment: comment.trim(),
      });
      haptics.success();
      Alert.alert(t('reviews.submitSuccess'));
      setRating(0);
      setComment('');
      onClose();
    } catch {
      haptics.error();
      Alert.alert(t('reviews.submitError'));
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="rounded-t-3xl bg-surface pb-8">
          {/* Handle bar */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-lg font-bold text-content">{t('reviews.writeReview')}</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#495057" />
            </Pressable>
          </View>

          <View className="px-4">
            <Text className="mb-1 text-sm text-content-secondary">
              {t('reviews.reviewFor', { name: vendorName })}
            </Text>

            {/* Star Rating */}
            <View className="my-4 flex-row items-center justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  className="mx-1"
                  onPress={() => {
                    setRating(star);
                    haptics.light();
                  }}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color="#fab005"
                  />
                </Pressable>
              ))}
            </View>
            {rating > 0 && (
              <Text className="mb-3 text-center text-sm font-medium text-content-secondary">
                {t(`reviews.rating${rating}`)}
              </Text>
            )}

            {/* Comment */}
            <TextInput
              className="mb-4 min-h-[120px] rounded-card border border-border bg-surface-secondary p-3 text-content"
              placeholder={t('reviews.commentPlaceholder')}
              placeholderTextColor="#868e96"
              multiline
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              maxLength={1000}
            />
            <Text className="mb-4 text-right text-xs text-content-tertiary">
              {comment.length}/1000
            </Text>

            <Button
              title={writeReview.isPending ? t('common.loading') : t('reviews.submit')}
              onPress={handleSubmit}
              disabled={writeReview.isPending || rating === 0}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
