import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { AppConfigService } from '../../../config/app-config.service';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(StorageHealthIndicator.name);

  constructor(private readonly config: AppConfigService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      const endpoint = this.config.s3.endpoint;
      const url = `${endpoint}/minio/health/live`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
          return this.getStatus(key, true);
        }
        throw new Error(`MinIO returned status ${response.status}`);
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    } catch (error) {
      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
