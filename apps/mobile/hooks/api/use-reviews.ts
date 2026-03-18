import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface WriteReviewData {
  providerId: string;
  rating: number;
  comment: string;
}

export function useWriteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WriteReviewData) => {
      const response = await api.post(`/providers/${data.providerId}/reviews`, {
        rating: data.rating,
        comment: data.comment,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.providerId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.providerId] });
    },
  });
}
