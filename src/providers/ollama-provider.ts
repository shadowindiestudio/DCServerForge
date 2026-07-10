import type { AIRequest, AIResponse, ChatMessage } from '../types/index.js';
import { BaseProvider, type ProviderChatOptions } from './base/base-provider.js';
import { buildPlanGenerationPrompt } from './base/prompts.js';

export class OllamaProvider extends BaseProvider {
  readonly name = 'ollama';

  protected get defaultBaseUrl(): string {
    return 'http://localhost:11434';
  }

  protected get defaultModel(): string {
    return 'llama3.1';
  }

  validateConfig(): boolean {
    return true;
  }

  async generatePlan(request: AIRequest): Promise<AIResponse> {
    const messages = buildPlanGenerationPrompt(request.prompt, request.guildName);
    return this.chat(messages, { temperature: 0.7 });
  }

  async chat(messages: ChatMessage[], options?: ProviderChatOptions): Promise<AIResponse> {
    const body = {
      model: options?.model ?? this.model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      message: { content: string };
      done: boolean;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      content: data.message?.content ?? '',
      usage: {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
      model: body.model,
      finishReason: data.done ? 'stop' : undefined,
    };
  }
}
