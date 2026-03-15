import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { AppConfigService } from '../../../config/app-config.service';

@Injectable()
export class SearchHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(SearchHealthIndicator.name);

  constructor(private readonly config: AppConfigService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      const url = `${this.config.meilisearch.url}/health`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
          return this.getStatus(key, true);
        }
        throw new Error(`Meilisearch returned status ${response.status}`);
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
