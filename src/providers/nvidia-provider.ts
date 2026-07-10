import type { AIRequest, AIResponse, ChatMessage } from '../types/index.js';
import { BaseProvider, type ProviderChatOptions } from './base/base-provider.js';
import { buildPlanGenerationPrompt } from './base/prompts.js';

export class NvidiaProvider extends BaseProvider {
  readonly name = 'nvidia';

  protected get defaultBaseUrl(): string {
    return 'https://integrate.api.nvidia.com/v1';
  }

  protected get defaultModel(): string {
    return 'nvidia/llama-3.1-nemotron-70b-instruct';
  }

  validateConfig(): boolean {
    return !!this.config.apiKey;
  }

  async generatePlan(request: AIRequest): Promise<AIResponse> {
    const messages = buildPlanGenerationPrompt(request.prompt, request.guildName);
    return this.chat(messages, { temperature: 0.7, maxTokens: 4096 });
  }

  async chat(messages: ChatMessage[], options?: ProviderChatOptions): Promise<AIResponse> {
    if (!this.validateConfig()) {
      throw new Error('NVIDIA provider requires an API key (AI_API_KEY)');
    }

    const body = {
      model: options?.model ?? this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`NVIDIA API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    return {
      content: data.choices[0]?.message?.content ?? '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      model: body.model,
      finishReason: data.choices[0]?.finish_reason,
    };
  }
}
