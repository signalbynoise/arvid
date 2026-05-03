import { z } from 'zod';
import { GenerateSummaryResponseSchema, GenerateSummaryResponse } from '../shared/schemas';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'x-ai/grok-4.1-fast';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('[WARN] [openrouter:init] OPENROUTER_API_KEY not set — summary generation will fail');
}

interface RequirementContext {
  title: string;
  description?: string;
  owner: string;
  source: string;
  clarity: string;
  risk: string;
}

interface QuestionContext {
  text: string;
  status: string;
  importance: string;
  category: string;
  author?: string;
  answers: AnswerContext[];
}

interface AnswerContext {
  text: string;
  author: string;
  isCurrent: boolean;
}

export interface SummaryGenerationInput {
  requirement: RequirementContext;
  questions: QuestionContext[];
}

function buildSystemPrompt(): string {
  return `You are Arvid, an AI specification analyst. Given a requirement and its associated questions and answers, produce a structured JSON analysis.

Your output MUST be valid JSON with exactly these keys:
- "synthesis": A 2-3 sentence executive summary of what this requirement covers, its current state, and key patterns observed.
- "core_objective": A clear statement of the primary goal — what needs to be built or achieved.
- "architecture": Technical approach, system design patterns, and implementation strategy derived from the Q&A.
- "constraints": Known rules, boundaries, limitations, and non-negotiables.
- "unverified_risks": Open questions, unresolved conflicts, missing information, and potential blockers.

Base your analysis entirely on the provided requirement, questions, and answers. Do not invent information. If areas lack answers, flag them as risks.

Respond ONLY with the JSON object, no markdown fences, no explanation.`;
}

function buildUserPrompt(input: SummaryGenerationInput): string {
  const { requirement, questions } = input;

  let prompt = `## Requirement\nTitle: ${requirement.title}\n`;
  if (requirement.description) prompt += `Description: ${requirement.description}\n`;
  prompt += `Owner: ${requirement.owner}\nSource: ${requirement.source}\nClarity: ${requirement.clarity}\nRisk: ${requirement.risk}\n\n`;

  prompt += `## Questions & Answers (${questions.length} total)\n\n`;

  for (const q of questions) {
    prompt += `### Q: ${q.text}\n`;
    prompt += `Status: ${q.status} | Importance: ${q.importance} | Category: ${q.category}\n`;
    if (q.author) prompt += `Asked by: ${q.author}\n`;

    if (q.answers.length > 0) {
      for (const a of q.answers) {
        const marker = a.isCurrent ? '[CURRENT] ' : '';
        prompt += `  A (${marker}${a.author}): ${a.text}\n`;
      }
    } else {
      prompt += `  No answers yet.\n`;
    }
    prompt += '\n';
  }

  return prompt;
}

export interface EnhanceContext {
  projectName?: string;
  existingRequirements?: string[];
}

export interface EnhanceResult {
  title: string;
  description: string;
}

export async function enhanceRequirement(rawText: string, context?: EnhanceContext): Promise<EnhanceResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  console.info(
    `[INFO] [openrouter:enhanceRequirement] Calling ${OPENROUTER_MODEL}`,
    JSON.stringify({ inputLength: rawText.length, project: context?.projectName }),
  );

  let contextBlock = '';
  if (context?.projectName) {
    contextBlock += `\n\nProject context:\n- Project: "${context.projectName}"`;
  }
  if (context?.existingRequirements && context.existingRequirements.length > 0) {
    contextBlock += `\n- Existing requirements in this project (${context.existingRequirements.length}):`;
    for (const r of context.existingRequirements) {
      contextBlock += `\n  • ${r}`;
    }
    contextBlock += `\n\nUse the project name and existing requirements to understand the domain, tone, and scope. Ensure the enhanced requirement is consistent with the project context and does not duplicate existing requirements.`;
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://arvid.work',
      'X-Title': 'Arvid',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are Arvid, an AI specification writer. Your job is to take a rough, informal requirement description and produce two things:

1. A concise, descriptive TITLE (3-8 words) that captures the core capability — e.g. "User Account Registration & Authentication", "Real-time Telemetry Ingestion Pipeline", "RBAC Financial Data Segmentation".
2. A professional DESCRIPTION that is the full enhanced requirement specification.

Rules for the description:
- Preserve the original intent completely — do not add features or scope the user did not mention.
- Write in third person, present tense ("The system shall...").
- Be specific about what is expected: inputs, outputs, constraints, acceptance criteria.
- Include edge cases and error handling considerations if they can be reasonably inferred.
- Use terminology and framing consistent with the project context and existing requirements.
- Do NOT duplicate or restate any existing requirement — the new requirement must add distinct value.

Your output MUST be valid JSON with exactly these keys:
- "title": The concise requirement title (3-8 words, no period at end).
- "description": The full enhanced requirement specification text.

Respond ONLY with the JSON object, no markdown fences, no explanation.`,
        },
        {
          role: 'user',
          content: `Enhance this requirement:${contextBlock}\n\nRaw input:\n${rawText}`,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      '[ERROR] [openrouter:enhanceRequirement] API call failed',
      JSON.stringify({ status: response.status, body: errorBody }),
    );
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('[ERROR] [openrouter:enhanceRequirement] No content in response', JSON.stringify(data));
    throw new Error('OpenRouter returned empty content');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('[ERROR] [openrouter:enhanceRequirement] Failed to parse JSON, using raw text', JSON.stringify({ content }));
    return { title: rawText.substring(0, 60), description: content.trim() };
  }

  const result = parsed as Record<string, unknown>;
  const title = typeof result.title === 'string' ? result.title : rawText.substring(0, 60);
  const description = typeof result.description === 'string' ? result.description : content.trim();

  console.info('[INFO] [openrouter:enhanceRequirement] Enhancement complete', JSON.stringify({ title, descriptionLength: description.length }));
  return { title, description };
}

export async function generateSummary(input: SummaryGenerationInput): Promise<GenerateSummaryResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  console.info(
    `[INFO] [openrouter:generateSummary] Calling ${OPENROUTER_MODEL}`,
    JSON.stringify({ requirementTitle: input.requirement.title, questionCount: input.questions.length }),
  );

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://arvid.work',
      'X-Title': 'Arvid',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[ERROR] [openrouter:generateSummary] API call failed`,
      JSON.stringify({ status: response.status, body: errorBody }),
    );
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('[ERROR] [openrouter:generateSummary] No content in response', JSON.stringify(data));
    throw new Error('OpenRouter returned empty content');
  }

  console.debug(
    '[DEBUG] [openrouter:generateSummary] Raw response content',
    JSON.stringify({ contentLength: content.length }),
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('[ERROR] [openrouter:generateSummary] Failed to parse JSON', JSON.stringify({ content }));
    throw new Error('OpenRouter returned invalid JSON');
  }

  const result = GenerateSummaryResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      '[ERROR] [openrouter:generateSummary] Response validation failed',
      JSON.stringify({ issues: result.error.issues }),
    );
    throw new Error('OpenRouter response did not match expected schema');
  }

  console.info('[INFO] [openrouter:generateSummary] Summary generated successfully');
  return result.data;
}

const ClassifyQuestionResponseSchema = z.object({
  importance: z.enum(['Critical', 'Important', 'Optional']),
  category: z.enum(['Scope', 'Data', 'Time', 'Output', 'Quality']),
});

export async function classifyQuestion(
  questionText: string,
  requirementTitle?: string,
  requirementDescription?: string,
): Promise<{ importance: string; category: string }> {
  if (!OPENROUTER_API_KEY) {
    return { importance: 'Important', category: 'Scope' };
  }

  console.debug('[DEBUG] [openrouter:classifyQuestion] Classifying question');

  let context = '';
  if (requirementTitle) context += `\nRequirement: ${requirementTitle}`;
  if (requirementDescription) context += `\nDescription: ${requirementDescription}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://arvid.work',
      'X-Title': 'Arvid',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: `Classify the following question about a software requirement. Return JSON with:
- "importance": "Critical" (blocks implementation), "Important" (affects quality), or "Optional" (nice to know)
- "category": "Scope" (boundaries), "Data" (inputs/formats), "Time" (deadlines/SLAs), "Output" (results/deliverables), or "Quality" (performance/security)

Respond ONLY with the JSON object.`,
        },
        {
          role: 'user',
          content: `Question: ${questionText}${context}`,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    return { importance: 'Important', category: 'Scope' };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return { importance: 'Important', category: 'Scope' };

  try {
    const parsed = JSON.parse(content);
    const validated = ClassifyQuestionResponseSchema.safeParse(parsed);
    if (validated.success) return validated.data;
  } catch { /* fallback */ }

  return { importance: 'Important', category: 'Scope' };
}

export interface ExistingQuestionContext {
  text: string;
  status: string;
  importance: string;
  category: string;
  answers: { text: string; author: string }[];
}

export interface SuggestQuestionsInput {
  requirementTitle: string;
  requirementDescription?: string;
  projectName?: string;
  existingRequirements?: string[];
  existingQuestions?: ExistingQuestionContext[];
}

export interface SuggestedQuestion {
  text: string;
  importance: 'Critical' | 'Important' | 'Optional';
  category: 'Scope' | 'Data' | 'Time' | 'Output' | 'Quality';
}

const SuggestedQuestionSchema = z.object({
  text: z.string(),
  importance: z.enum(['Critical', 'Important', 'Optional']),
  category: z.enum(['Scope', 'Data', 'Time', 'Output', 'Quality']),
});

const SuggestQuestionsResponseSchema = z.object({
  coverage_analysis: z.string().optional(),
  questions: z.array(SuggestedQuestionSchema),
});

export async function suggestQuestions(input: SuggestQuestionsInput): Promise<SuggestedQuestion[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  console.info(
    `[INFO] [openrouter:suggestQuestions] Calling ${OPENROUTER_MODEL}`,
    JSON.stringify({
      requirementTitle: input.requirementTitle,
      project: input.projectName,
      existingQuestionCount: input.existingQuestions?.length ?? 0,
    }),
  );

  let contextBlock = '';
  if (input.projectName) {
    contextBlock += `\nProject: "${input.projectName}"`;
  }
  if (input.existingRequirements && input.existingRequirements.length > 0) {
    contextBlock += `\nOther requirements in this project:`;
    for (const r of input.existingRequirements) {
      contextBlock += `\n  - ${r}`;
    }
  }

  let qaTreeBlock = '';
  if (input.existingQuestions && input.existingQuestions.length > 0) {
    qaTreeBlock += `\n\n## Existing Questions & Answers (${input.existingQuestions.length} total)\n`;
    for (const q of input.existingQuestions) {
      qaTreeBlock += `\n### Q [${q.status}] [${q.importance}] [${q.category}]: ${q.text}`;
      if (q.answers.length > 0) {
        for (const a of q.answers) {
          qaTreeBlock += `\n  A (${a.author}): ${a.text}`;
        }
      } else {
        qaTreeBlock += `\n  No answers yet.`;
      }
    }
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://arvid.work',
      'X-Title': 'Arvid',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are Arvid, an AI specification analyst. Your job is to perform a coverage analysis on a requirement and identify gaps that need clarification before implementation can begin.

## Coverage Framework
Every requirement must be interrogated across five dimensions:
- **Scope**: What is included and excluded? Boundaries, edge cases, phasing.
- **Data**: Inputs, outputs, formats, volumes, sources, validation rules.
- **Time**: Deadlines, SLAs, scheduling, sequencing, migration timing.
- **Output**: Expected results, deliverables, success criteria, acceptance tests.
- **Quality**: Performance, security, reliability, scalability, compliance.

## Process
1. Review the requirement title and description.
2. Review ALL existing questions and their answers (if any).
3. For each dimension, determine whether it has been adequately covered by existing questions and answers.
4. Generate ONLY questions that fill genuine gaps — dimensions or aspects that have NOT been asked about or answered.
5. Do NOT duplicate, rephrase, or overlap with any existing question.
6. If a dimension is fully covered, do not generate questions for it.
7. If ALL dimensions are sufficiently covered, return an empty questions array.

## Importance Rules
- "Critical": Blocks implementation — without this answer, work cannot begin safely.
- "Important": Affects quality or architecture — work can start but risks are elevated.
- "Optional": Nice to clarify — improves understanding but is not blocking.

## Output Format
Your output MUST be valid JSON with these keys:
- "coverage_analysis": A brief (2-3 sentence) assessment of current coverage state.
- "questions": An array of objects, each with "text" (string ending in "?"), "importance" ("Critical"|"Important"|"Optional"), and "category" ("Scope"|"Data"|"Time"|"Output"|"Quality").

Return an EMPTY questions array if coverage is sufficient. Do not invent gaps that don't exist.

Respond ONLY with the JSON object, no markdown fences.`,
        },
        {
          role: 'user',
          content: `Analyze coverage gaps for this requirement:

Title: ${input.requirementTitle}
${input.requirementDescription ? `Description: ${input.requirementDescription}` : ''}
${contextBlock}${qaTreeBlock}`,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      '[ERROR] [openrouter:suggestQuestions] API call failed',
      JSON.stringify({ status: response.status, body: errorBody }),
    );
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('[ERROR] [openrouter:suggestQuestions] No content in response', JSON.stringify(data));
    throw new Error('OpenRouter returned empty content');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('[ERROR] [openrouter:suggestQuestions] Failed to parse JSON', JSON.stringify({ content }));
    throw new Error('OpenRouter returned invalid JSON');
  }

  const result = SuggestQuestionsResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      '[ERROR] [openrouter:suggestQuestions] Response validation failed',
      JSON.stringify({ issues: result.error.issues }),
    );
    throw new Error('OpenRouter response did not match expected schema');
  }

  if (result.data.coverage_analysis) {
    console.info(
      '[INFO] [openrouter:suggestQuestions] Coverage analysis',
      JSON.stringify({ analysis: result.data.coverage_analysis }),
    );
  }

  console.info('[INFO] [openrouter:suggestQuestions] Generated suggestions', JSON.stringify({ count: result.data.questions.length }));
  return result.data.questions;
}
