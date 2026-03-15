export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  EXPORT: 'export',
  CLEANUP: 'cleanup',
  INDEXING: 'indexing',
  AI: 'ai',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const ALL_QUEUE_NAMES: QueueName[] = Object.values(QUEUES);

export const DEAD_LETTER_QUEUE = 'dead-letter';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: false,
};

export const QUEUE_JOB_OPTIONS: Record<
  QueueName,
  { attempts: number; backoff: { type: 'exponential'; delay: number } }
> = {
  [QUEUES.EMAIL]: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
  },
  [QUEUES.NOTIFICATION]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
  [QUEUES.EXPORT]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
  [QUEUES.CLEANUP]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
  [QUEUES.INDEXING]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
  [QUEUES.AI]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
  },
};
