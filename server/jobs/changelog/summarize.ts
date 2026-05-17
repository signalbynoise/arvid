import { CHANGELOG_OPENROUTER_MODEL } from '../changelogConfig';
import type { CategorizedCommits } from './categorizeCommits';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export interface ChangelogSummary {
  content: string;
  excerpt: string;
}

function buildPrompt(categorized: CategorizedCommits, dateStr: string): string {
  const sections: string[] = [];

  if (categorized.features.length > 0) {
    sections.push(`### New Features\n${categorized.features.map((c) => `- ${c}`).join('\n')}`);
  }
  if (categorized.fixes.length > 0) {
    sections.push(`### Bug Fixes\n${categorized.fixes.map((c) => `- ${c}`).join('\n')}`);
  }
  if (categorized.refactors.length > 0) {
    sections.push(`### Refactoring\n${categorized.refactors.map((c) => `- ${c}`).join('\n')}`);
  }
  if (categorized.docs.length > 0) {
    sections.push(`### Documentation\n${categorized.docs.map((c) => `- ${c}`).join('\n')}`);
  }
  if (categorized.chores.length > 0) {
    sections.push(`### Maintenance\n${categorized.chores.map((c) => `- ${c}`).join('\n')}`);
  }
  if (categorized.other.length > 0) {
    sections.push(`### Other Changes\n${categorized.other.map((c) => `- ${c}`).join('\n')}`);
  }

  return `Summarize the following commit log for the Arvid platform (${dateStr}) into a concise, readable Markdown changelog entry.

Arvid is a requirements management platform for engineering teams. It connects GitHub, Linear, Slack, Supabase, Figma, and Render to build a knowledge graph from requirements, questions, and answers.

Group changes by category. Use clear, human-friendly language — not raw commit messages. Collapse trivial or repetitive changes. The audience is Arvid users wanting to know what changed.

Commit log:
${sections.join('\n\n')}

Respond with ONLY a JSON object with these keys:
- "content": The full changelog body in Markdown. Do NOT include a title heading — it is set separately. Start with a brief 1-2 sentence overview paragraph, then list changes by category using ### headings.
- "excerpt": A 1-sentence summary (max 160 characters).

Respond ONLY with the JSON object, no markdown fences.`;
}

export async function summarizeCommits(categorized: CategorizedCommits, dateStr: string): Promise<ChangelogSummary> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const prompt = buildPrompt(categorized, dateStr);

  console.info('[INFO] [changelog:summarize] Requesting AI summary', JSON.stringify({ model: CHANGELOG_OPENROUTER_MODEL }));

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://arvid.work',
      'X-Title': 'Arvid Changelog',
    },
    body: JSON.stringify({
      model: CHANGELOG_OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a technical changelog writer for Arvid, a requirements management platform. You produce concise, well-organized changelog summaries from commit logs. Output valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} — ${errorBody}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error('OpenRouter returned empty content');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[WARN] [changelog:summarize] Failed to parse JSON response, using raw content');
    return { content: raw.trim(), excerpt: '' };
  }

  return {
    content: typeof parsed.content === 'string' ? parsed.content : raw.trim(),
    excerpt: typeof parsed.excerpt === 'string' ? parsed.excerpt : '',
  };
}
