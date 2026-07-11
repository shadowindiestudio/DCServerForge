import type { ProviderConfig } from '../types/index.js';
import { AIProvider } from '../types/enums.js';

import { NvidiaProvider } from './nvidia-provider.js';
import { OllamaProvider } from './ollama-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { CustomProvider } from './custom-provider.js';

import type { AIProviderInterface } from './base/base-provider.js';

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
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}