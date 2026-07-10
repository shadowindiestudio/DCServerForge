import type { AIRequest, AIResponse, ChatMessage, ProviderConfig } from '../../types/index.js';
import { AIProvider } from '../../types/enums.js';
import { NvidiaProvider } from '../nvidia-provider.js';
import { OllamaProvider } from '../ollama-provider.js';
import { OpenAIProvider } from '../openai-provider.js';
import { CustomProvider } from '../custom-provider.js';

export interface AIProviderInterface {
  readonly name: string;

  generatePlan(request: AIRequest): Promise<AIResponse>;
  chat(messages: ChatMessage[], options?: ProviderChatOptions): Promise<AIResponse>;
  validateConfig(): boolean;
}

export interface ProviderChatOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly model?: string;
}

export abstract class BaseProvider implements AIProviderInterface {
  abstract readonly name: string;
  protected readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract generatePlan(request: AIRequest): Promise<AIResponse>;
  abstract chat(messages: ChatMessage[], options?: ProviderChatOptions): Promise<AIResponse>;
  abstract validateConfig(): boolean;

  protected get baseUrl(): string {
    return this.config.baseUrl ?? this.defaultBaseUrl;
  }

  protected get model(): string {
    return this.config.model ?? this.defaultModel;
  }

  protected get timeoutMs(): number {
    return this.config.timeoutMs ?? 30000;
  }

  protected abstract get defaultBaseUrl(): string;
  protected abstract get defaultModel(): string;
}

export function createProvider(config: ProviderConfig): AIProviderInterface {
  switch (config.provider) {
    case AIProvider.NVIDIA:
      return new NvidiaProvider(config);
    case AIProvider.OLLAMA:
      return new OllamaProvider(config);
    case AIProvider.OPENAI:
      return new OpenAIProvider(config);
    case AIProvider.CUSTOM:
      return new CustomProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${config.provider as string}`);
  }
}


