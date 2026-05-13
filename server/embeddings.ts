import { createHash } from 'crypto';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings';
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export function contentHash(title: string, description?: string | null): string {
  const text = `${title}\n${description || ''}`;
  return createHash('sha256').update(text).digest('hex');
}

export function embeddingInput(title: string, description?: string | null): string {
  const desc = description?.trim();
  return desc ? `${title}\n${desc}` : title;
}

interface EmbeddingResponseData {
  object: string;
  embedding: number[];
  index: number;
}

interface EmbeddingResponse {
  data: EmbeddingResponseData[];
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('[embeddings] OPENROUTER_API_KEY not set');
  }

  if (texts.length === 0) return [];

  console.log(`[INFO] [embeddings:generate] Generating embeddings for ${texts.length} texts via ${EMBEDDING_MODEL}`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://arvid.work',
      'X-Title': 'Arvid',
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[ERROR] [embeddings:generate] OpenRouter responded ${response.status}: ${body}`);
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const result: EmbeddingResponse = await response.json();

  const sorted = result.data.sort((a, b) => a.index - b.index);
  console.log(`[INFO] [embeddings:generate] Received ${sorted.length} embeddings, ${result.usage.total_tokens} tokens used`);

  return sorted.map(d => d.embedding);
}
