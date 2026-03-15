import {
  QUEUES,
  ALL_QUEUE_NAMES,
  DEAD_LETTER_QUEUE,
  DEFAULT_JOB_OPTIONS,
  QUEUE_JOB_OPTIONS,
} from './queues';

describe('Queue Constants', () => {
  describe('QUEUES', () => {
    it('should define all required queue names', () => {
      expect(QUEUES.EMAIL).toBe('email');
      expect(QUEUES.NOTIFICATION).toBe('notification');
      expect(QUEUES.EXPORT).toBe('export');
      expect(QUEUES.CLEANUP).toBe('cleanup');
      expect(QUEUES.INDEXING).toBe('indexing');
      expect(QUEUES.AI).toBe('ai');
    });

    it('should have exactly 6 queues', () => {
      expect(Object.keys(QUEUES)).toHaveLength(6);
    });
  });

  describe('ALL_QUEUE_NAMES', () => {
    it('should contain all queue values', () => {
      expect(ALL_QUEUE_NAMES).toEqual(expect.arrayContaining(Object.values(QUEUES)));
      expect(ALL_QUEUE_NAMES).toHaveLength(Object.keys(QUEUES).length);
    });
  });

  describe('DEAD_LETTER_QUEUE', () => {
    it('should be defined', () => {
      expect(DEAD_LETTER_QUEUE).toBe('dead-letter');
    });
  });

  describe('DEFAULT_JOB_OPTIONS', () => {
    it('should have 3 default retries', () => {
      expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3);
    });

    it('should use exponential backoff starting at 1s', () => {
      expect(DEFAULT_JOB_OPTIONS.backoff).toEqual({
        type: 'exponential',
        delay: 1000,
      });
    });
  });

  describe('QUEUE_JOB_OPTIONS', () => {
    it('should configure email queue with 5 retries', () => {
      expect(QUEUE_JOB_OPTIONS[QUEUES.EMAIL].attempts).toBe(5);
    });

    it('should configure AI queue with 2 retries', () => {
      expect(QUEUE_JOB_OPTIONS[QUEUES.AI].attempts).toBe(2);
    });

    it('should configure AI queue with 2s backoff delay', () => {
      expect(QUEUE_JOB_OPTIONS[QUEUES.AI].backoff.delay).toBe(2000);
    });

    it('should have options for all queues', () => {
      for (const name of ALL_QUEUE_NAMES) {
        expect(QUEUE_JOB_OPTIONS[name]).toBeDefined();
        expect(QUEUE_JOB_OPTIONS[name].attempts).toBeGreaterThan(0);
        expect(QUEUE_JOB_OPTIONS[name].backoff.type).toBe('exponential');
      }
    });
  });
});
