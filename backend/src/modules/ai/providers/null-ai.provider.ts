import { Injectable } from '@nestjs/common';
import { AI_PROVIDER_ERROR_CODES, AiProviderError } from './ai-provider.errors';
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProvider,
} from './ai-provider.interface';

@Injectable()
export class NullAiProvider implements AiProvider {
  complete(_request: AiCompletionRequest): Promise<AiCompletionResponse> {
    return Promise.reject(
      new AiProviderError(
        AI_PROVIDER_ERROR_CODES.NOT_CONFIGURED,
        'No AI provider is configured for this workspace.',
      ),
    );
  }
}
