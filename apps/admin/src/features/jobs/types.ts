export interface QueueStats {
  name: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
}
