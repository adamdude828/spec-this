import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client with API key
 * @param apiKey - OpenAI API key (if not provided, uses OPENAI_API_KEY env var)
 */
export function initOpenAI(apiKey?: string): void {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it as an argument.');
  }
  openaiClient = new OpenAI({ apiKey: key });
}

/**
 * Get OpenAI client instance (initializes if needed)
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    initOpenAI();
  }
  return openaiClient!;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 * This model produces 1536-dimensional vectors
 * @param text - The text to generate embeddings for
 * @param model - The embedding model to use (default: text-embedding-3-small)
 * @returns Embedding vector and usage information
 */
export async function generateEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  try {
    const client = getOpenAIClient();

    // Truncate text if it's too long (max ~8000 tokens for text-embedding-3-small)
    // Roughly 1 token = 4 characters, so limit to ~30,000 characters to be safe
    const truncatedText = text.length > 30000 ? text.substring(0, 30000) : text;

    const response = await client.embeddings.create({
      model,
      input: truncatedText,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI');
    }

    return {
      embedding: response.data[0].embedding,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to generate embeddings for
 * @param model - The embedding model to use (default: text-embedding-3-small)
 * @returns Array of embeddings in the same order as input texts
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult[]> {
  try {
    const client = getOpenAIClient();

    // Truncate texts if needed
    const truncatedTexts = texts.map(text =>
      text.length > 30000 ? text.substring(0, 30000) : text
    );

    const response = await client.embeddings.create({
      model,
      input: truncatedTexts,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI');
    }

    return response.data.map((item, index) => ({
      embedding: item.embedding,
      model: response.model,
      usage: {
        promptTokens: Math.floor(response.usage.prompt_tokens / texts.length),
        totalTokens: Math.floor(response.usage.total_tokens / texts.length),
      },
    }));
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity score (0 to 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
