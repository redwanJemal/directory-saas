import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

/**
 * Factory that creates the AI language model based on configuration.
 * Isolates heavy AI SDK imports from the rest of the module.
 */
@Injectable()
export class AiProviderFactory {
  constructor(private readonly config: AppConfigService) {}

  /**
   * Creates and returns a language model instance.
   * Returns `any` to avoid propagating heavy AI SDK types.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createModel(): any {
    const { provider, model, apiKey } = this.config.ai;

    if (provider === 'openai') {
      // Dynamic require to isolate type resolution
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createOpenAI } = require('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }

    // Default to Anthropic
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAnthropic } = require('@ai-sdk/anthropic');
    const anthropic = createAnthropic({ apiKey });
    return anthropic(model);
  }

  /**
   * Calls streamText from the AI SDK.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  streamText(options: Record<string, unknown>): any {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { streamText } = require('ai');
    return streamText(options);
  }
}
