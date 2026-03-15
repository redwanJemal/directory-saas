# Task 16: Background Jobs — BullMQ + Redis

## Summary
Implement background job processing with BullMQ for async tasks like email sending, data export, cleanup, and scheduled jobs. Include retry policies, dead-letter queues, and a monitoring dashboard.

## Current State
- Redis configured (Task 03).
- Logger available (Task 06).

## Required Changes

### 16.1 Job Module

**File**: `backend/src/common/services/job.service.ts`

```typescript
@Injectable()
export class JobService {
  // Add a job to a named queue
  async add<T>(queueName: string, jobName: string, data: T, opts?: JobOptions): Promise<Job<T>>;

  // Add a delayed job
  async addDelayed<T>(queueName: string, jobName: string, data: T, delayMs: number): Promise<Job<T>>;

  // Add a recurring job (cron)
  async addRecurring<T>(queueName: string, jobName: string, data: T, cron: string): Promise<void>;

  // Get job by ID
  async getJob(queueName: string, jobId: string): Promise<Job | null>;
}
```

### 16.2 Queue Definitions

```typescript
const QUEUES = {
  EMAIL: 'email',           // Email sending
  NOTIFICATION: 'notification', // Push/in-app notifications
  EXPORT: 'export',         // Data exports (CSV, PDF)
  CLEANUP: 'cleanup',       // Expired data cleanup
  INDEXING: 'indexing',     // Search index updates
  AI: 'ai',                 // AI processing tasks
};
```

### 16.3 Job Processor Pattern

```typescript
@Processor('email')
export class EmailProcessor extends WorkerHost {
  @OnWorkerEvent('completed')
  onCompleted(job: Job) { this.logger.log(`Job ${job.id} completed`); }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) { this.logger.error(`Job ${job.id} failed`, error); }

  async process(job: Job): Promise<void> {
    // Process job
  }
}
```

### 16.4 Retry Policy

- Default: 3 retries with exponential backoff (1s, 5s, 30s)
- Email: 5 retries (transient SMTP failures)
- AI: 2 retries (expensive operations)
- After max retries → move to dead-letter queue

### 16.5 Scheduled Jobs

```typescript
// Cleanup expired refresh tokens (daily at 2 AM)
@Cron('0 2 * * *')
async cleanupRefreshTokens() {}

// Cleanup expired presigned URLs metadata (daily at 3 AM)
@Cron('0 3 * * *')
async cleanupExpiredUploads() {}
```

### 16.6 Bull Board Dashboard

Mount Bull Board at `/api/v1/admin/queues` (admin only):
- View all queues, active/waiting/completed/failed jobs
- Retry failed jobs
- Clean completed jobs

### 16.7 Tests

- Test: Job added to queue with correct data
- Test: Job processed by correct processor
- Test: Failed job retried with backoff
- Test: After max retries, job moves to dead-letter queue
- Test: Delayed job executes after delay
- Test: Recurring job runs on schedule
- Test: Bull Board accessible to admins only

## Acceptance Criteria

1. BullMQ with Redis backend
2. Named queues for different job types
3. Retry with exponential backoff
4. Dead-letter queue for permanently failed jobs
5. Scheduled/cron jobs
6. Bull Board dashboard (admin only)
7. All tests pass
