import OpenAI from 'openai';

export type LLMProvider = 'openai' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseURL?: string;
  model: string;
}

export interface LLMResponse {
  content: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Create an LLM client based on configuration
 */
export function createLLMClient(config: LLMConfig): OpenAI {
  if (config.provider === 'ollama') {
    // Ollama uses OpenAI-compatible API
    return new OpenAI({
      baseURL: config.baseURL || 'http://localhost:11434/v1',
      apiKey: config.apiKey || 'ollama', // Ollama doesn't require a real key
    });
  } else {
    // OpenAI
    if (!config.apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider');
    }
    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL, // Optional custom base URL
    });
  }
}

/**
 * Call LLM with messages
 */
export async function callLLM(
  client: OpenAI,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    responseFormat?: { type: 'json_object' };
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse> {
  const completion = await client.chat.completions.create({
    model: model,
    messages: messages,
    response_format: options?.responseFormat,
    temperature: options?.temperature,
    max_tokens: options?.maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('LLM response was empty');
  }

  return {
    content,
    model: completion.model,
    usage: completion.usage ? {
      prompt_tokens: completion.usage.prompt_tokens,
      completion_tokens: completion.usage.completion_tokens,
      total_tokens: completion.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Get default LLM configuration from environment
 */
export function getLLMConfigFromEnv(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase() as LLMProvider;
  
  if (provider === 'ollama') {
    return {
      provider: 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b', // Small model for low RAM
    };
  } else {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    };
  }
}

