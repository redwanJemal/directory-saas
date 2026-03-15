import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { QueueStats } from '../types';

export function useQueueStatsQuery() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const response = await api.get<{ data: QueueStats[] }>(
        '/admin/queues/stats',
      );
      return response.data.data;
    },
    refetchInterval: 5_000,
  });
}
