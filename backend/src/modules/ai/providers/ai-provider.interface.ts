export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiCompletionMessage {
  readonly role: string;
  readonly content: string;
}

export interface AiCompletionRequest {
  readonly model?: string;
  readonly messages: readonly AiCompletionMessage[];
  readonly maxTokens?: number;
}

export interface AiCompletionResponse {
  readonly content: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly model?: string;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
