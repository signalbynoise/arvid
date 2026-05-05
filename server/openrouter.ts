import { z } from 'zod';
import { GenerateSummaryResponseSchema, GenerateSummaryResponse } from '../shared/schemas';
import type { RepoAnalysis } from '../shared/schemas/repoContext';

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
  repoContext?: RepoAnalysis;
}

function buildCodebaseContextBlock(repoContext: RepoAnalysis): string {
  const parts: string[] = ['## Codebase Context'];

  if (repoContext.languages.length > 0) {
    const langs = repoContext.languages.slice(0, 5).map(l => `${l.name} (${l.percentage}%)`).join(', ');
    parts.push(`Languages: ${langs}`);
  }

  if (repoContext.frameworks.length > 0) {
    parts.push(`Frameworks: ${repoContext.frameworks.join(', ')}`);
  }

  const runtimeDeps = repoContext.dependencies.filter(d => d.type === 'runtime');
  const devDeps = repoContext.dependencies.filter(d => d.type === 'dev');
  if (runtimeDeps.length > 0 || devDeps.length > 0) {
    parts.push(`Dependencies: ${runtimeDeps.length} runtime, ${devDeps.length} dev`);
    const keyDeps = runtimeDeps.slice(0, 8).map(d => d.name).join(', ');
    if (keyDeps) parts.push(`Key deps: ${keyDeps}`);
  }

  if (repoContext.patterns.length > 0) {
    parts.push(`Patterns: ${repoContext.patterns.join(', ')}`);
  }

  if (repoContext.testFramework) {
    parts.push(`Testing: ${repoContext.testFramework}`);
  }

  if (repoContext.buildTool) {
    parts.push(`Build: ${repoContext.buildTool}`);
  }

  if (repoContext.cicd) {
    parts.push(`CI/CD: ${repoContext.cicd}`);
  }

  if (repoContext.summary) {
    parts.push(`Summary: ${repoContext.summary}`);
  }

  return parts.join('\n') + '\n\n';
}

function buildSystemPrompt(): string {
  return `You are Arvid, an AI specification analyst. Given a requirement and its associated questions and answers, produce a structured JSON analysis.

Your output MUST be valid JSON with exactly these keys:
- "synthesis": A 2-3 sentence executive summary of what this requirement covers, its current state, and key patterns observed.
- "core_objective": A clear statement of the primary goal — what needs to be built or achieved.
- "architecture": Technical approach, system design patterns, and implementation strategy derived from the Q&A.
- "constraints": Known rules, boundaries, limitations, and non-negotiables.
- "unverified_risks": Open questions, unresolved conflicts, missing information, and potential blockers.
- "completeness": An integer from 0 to 100 representing implementation readiness.
- "completeness_reasoning": A 1-2 sentence explanation of why you gave this completeness score.

## Completeness Assessment Rules
The completeness score answers: "Can an engineer start building this with reasonable confidence?"

Scoring guidelines:
- 100 means the critical decisions are clear. It does NOT require perfection or exhaustive detail.
- Unanswered "Optional" or "Important" questions must NOT prevent reaching 100 if the Critical ones are addressed.
- A well-written requirement description counts as implicit answers — if the description already makes something clear, don't penalize for not having a separate Q&A about it.
- Conflicting answers on Critical questions should reduce the score (to ~40-60).
- A requirement with 2-3 Critical questions answered should typically score 85-100.
- A requirement with a detailed description and even 1-2 answered questions can reach 100 if the description covers the gaps.
- When in doubt, round UP generously. The goal is to unblock users, not gatekeep.
- An empty requirement with zero questions should score 10-20 (it exists, but hasn't been validated at all).
- Be encouraging. If someone has answered the key questions, reward them with 100.

Base your analysis entirely on the provided requirement, questions, and answers. If codebase context is provided, use it to ground your analysis in the project's actual technology stack and architecture — but do not hallucinate details beyond what the context provides. If areas lack answers, flag them as risks.

Respond ONLY with the JSON object, no markdown fences, no explanation.`;
}

function buildUserPrompt(input: SummaryGenerationInput): string {
  const { requirement, questions, repoContext } = input;

  let prompt = '';

  if (repoContext) {
    prompt += buildCodebaseContextBlock(repoContext);
  }

  prompt += `## Requirement\nTitle: ${requirement.title}\n`;
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
  repoContext?: RepoAnalysis;
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
  if (context?.repoContext) {
    contextBlock += `\n\n${buildCodebaseContextBlock(context.repoContext)}Use the codebase context to ground the requirement in the actual technology stack, naming conventions, and architecture of the project.`;
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

export interface SlackMessageInput {
  slack_ts: string;
  username: string;
  text: string;
  thread_ts?: string;
}

export interface AnalyzedRequirement {
  title: string;
  description: string;
  sourceMessageTs: string[];
}

export async function analyzeSlackMessages(messages: SlackMessageInput[], existingRequirements: string[] = []): Promise<AnalyzedRequirement[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  console.info(
    `[INFO] [openrouter:analyzeSlackMessages] Calling ${OPENROUTER_MODEL}`,
    JSON.stringify({ messageCount: messages.length, existingCount: existingRequirements.length }),
  );

  const messageBlock = messages.map(m => {
    const threadTag = m.thread_ts ? ` [thread:${m.thread_ts}]` : '';
    return `[${m.slack_ts}] @${m.username}${threadTag}: ${m.text}`;
  }).join('\n');

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
          content: `You are Arvid, an AI specification writer. You analyze Slack messages from a team channel and identify actionable software requirements, feature requests, or technical decisions.

Your task:
1. Read the messages and identify distinct requirements, feature requests, bugs, or technical decisions.
2. For each one, produce a structured requirement with a title and professional description.
3. Tag each requirement with the slack_ts timestamps of the messages it was derived from.

Rules:
- Only extract genuine requirements/requests — ignore casual chat, greetings, or off-topic messages.
- If messages form a thread discussing the same topic, group them into one requirement.
- Write descriptions in third person, present tense ("The system shall...").
- Be specific about what is expected: inputs, outputs, constraints.
- If no actionable requirements exist in the messages, return an empty array.
- Return between 0 and 5 requirements maximum.
- Do NOT suggest requirements that overlap with or duplicate any existing requirements listed below.

Respond with valid JSON in this exact format:
{
  "requirements": [
    {
      "title": "Short descriptive title (3-8 words)",
      "description": "Professional requirement description...",
      "sourceMessageTs": ["1234567890.123456", "1234567891.654321"]
    }
  ]
}`,
        },
        {
          role: 'user',
          content: existingRequirements.length > 0
            ? `Existing requirements in this project (do NOT duplicate these):\n${existingRequirements.map(t => `- ${t}`).join('\n')}\n\nAnalyze these Slack messages and extract NEW requirements:\n\n${messageBlock}`
            : `Analyze these Slack messages and extract requirements:\n\n${messageBlock}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      '[ERROR] [openrouter:analyzeSlackMessages] API call failed',
      JSON.stringify({ status: response.status, body: errorBody }),
    );
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('[ERROR] [openrouter:analyzeSlackMessages] No content in response');
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('[ERROR] [openrouter:analyzeSlackMessages] Failed to parse JSON');
    return [];
  }

  const result = parsed as { requirements?: unknown[] };
  if (!Array.isArray(result.requirements)) {
    return [];
  }

  const analyzed: AnalyzedRequirement[] = result.requirements
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map(r => ({
      title: typeof r.title === 'string' ? r.title : 'Untitled',
      description: typeof r.description === 'string' ? r.description : '',
      sourceMessageTs: Array.isArray(r.sourceMessageTs)
        ? r.sourceMessageTs.filter((ts): ts is string => typeof ts === 'string')
        : [],
    }))
    .filter(r => r.description.length > 0);

  console.info(
    '[INFO] [openrouter:analyzeSlackMessages] Analysis complete',
    JSON.stringify({ requirementCount: analyzed.length }),
  );

  return analyzed;
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

export interface ClassifyQuestionContext {
  requirement?: {
    title: string;
    description?: string;
    owner: string;
    source: string;
    clarity: string;
    risk: string;
  };
  projectName?: string;
  siblingRequirements?: string[];
  existingQuestions?: {
    text: string;
    status: string;
    importance: string;
    category: string;
    answers: { text: string; author: string }[];
  }[];
  repoContext?: RepoAnalysis;
}

export async function classifyQuestion(
  questionText: string,
  context: ClassifyQuestionContext | null,
): Promise<{ importance: string; category: string }> {
  if (!OPENROUTER_API_KEY) {
    return { importance: 'Important', category: 'Scope' };
  }

  console.debug('[DEBUG] [openrouter:classifyQuestion] Classifying question');

  let userMessage = `## New Question to Classify\n${questionText}\n`;

  if (context?.requirement) {
    userMessage += `\n## Requirement\nTitle: ${context.requirement.title}\n`;
    if (context.requirement.description) {
      userMessage += `Description: ${context.requirement.description}\n`;
    }
    userMessage += `Owner: ${context.requirement.owner} | Source: ${context.requirement.source}\n`;
    userMessage += `Clarity: ${context.requirement.clarity} | Risk: ${context.requirement.risk}\n`;
  }

  if (context?.projectName) {
    userMessage += `\nProject: "${context.projectName}"\n`;
  }

  if (context?.siblingRequirements && context.siblingRequirements.length > 0) {
    userMessage += `\nOther requirements in this project:\n`;
    for (const r of context.siblingRequirements) {
      userMessage += `  - ${r}\n`;
    }
  }

  if (context?.existingQuestions && context.existingQuestions.length > 0) {
    userMessage += `\n## Existing Q&A Coverage (${context.existingQuestions.length} questions)\n`;
    for (const q of context.existingQuestions) {
      userMessage += `\nQ [${q.status}] [${q.importance}] [${q.category}]: ${q.text}`;
      if (q.answers.length > 0) {
        for (const a of q.answers) {
          userMessage += `\n  A (${a.author}): ${a.text}`;
        }
      }
    }
    userMessage += '\n';
  }

  if (context?.repoContext) {
    userMessage += `\n${buildCodebaseContextBlock(context.repoContext)}`;
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
          content: `You are Arvid, an AI specification analyst. Classify the following question about a software requirement.

## Importance Levels
- "Critical": Without this answer, an engineer would have to guess or make dangerous assumptions. Implementation cannot safely begin. This question addresses a fundamental unknown.
- "Important": Affects architecture or quality decisions, but a reasonable default can be assumed. Work can start, though risks are elevated without an answer.
- "Optional": Refines understanding or addresses edge cases. Implementation can safely proceed without this answer — it is nice to know, not need to know.

## Category Dimensions
- "Scope": Boundaries, inclusions/exclusions, edge cases, phasing, feature limits.
- "Data": Inputs, outputs, formats, volumes, sources, validation rules, schemas.
- "Time": Deadlines, SLAs, scheduling, sequencing, migration timing, frequency.
- "Output": Expected results, deliverables, success criteria, acceptance tests.
- "Quality": Performance, security, reliability, scalability, compliance, UX standards.

## Context-Aware Classification Rules
- If the existing Q&A already covers this dimension well, bias toward "Optional" — the gap is likely minor.
- If the requirement description is detailed and already addresses what the question asks, bias toward "Optional".
- If no other questions cover this dimension and the requirement description is vague about it, bias toward "Critical".
- Consider the project domain and sibling requirements when judging how blocking an unknown is.

Return ONLY a JSON object with "importance" and "category" keys.`,
        },
        {
          role: 'user',
          content: userMessage,
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

export interface PriorSuggestionContext {
  text: string;
  importance: string;
  category: string;
  disposition: 'pending' | 'accepted' | 'rejected';
}

export interface SuggestQuestionsInput {
  requirementTitle: string;
  requirementDescription?: string;
  projectName?: string;
  existingRequirements?: string[];
  existingQuestions?: ExistingQuestionContext[];
  suggestionHistory?: PriorSuggestionContext[];
  repoContext?: RepoAnalysis;
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
      priorSuggestionCount: input.suggestionHistory?.length ?? 0,
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

  let suggestionHistoryBlock = '';
  if (input.suggestionHistory && input.suggestionHistory.length > 0) {
    suggestionHistoryBlock += `\n\n## Your Prior Suggestions (${input.suggestionHistory.length} total)\nThese are questions YOU previously suggested for this requirement. DO NOT repeat or rephrase any of them.\n`;
    for (const s of input.suggestionHistory) {
      suggestionHistoryBlock += `\n- [${s.disposition.toUpperCase()}] [${s.importance}] [${s.category}]: ${s.text}`;
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
          content: `You are Arvid, a friendly AI specification assistant. Your job is to ask the few most important clarifying questions about a requirement — the kind a smart colleague would ask over coffee, not an exhaustive audit.

## Philosophy
- Less is more. Ask only what an engineer ACTUALLY needs to know before starting work.
- Write like a human, not a consultant. Short, plain-language questions a non-technical stakeholder can answer.
- Avoid jargon, implementation details, and edge-case rabbit holes unless the requirement explicitly involves them.
- Trust that engineers can make reasonable decisions about minor details — focus on the big unknowns.

## Coverage Dimensions (use as a mental checklist, NOT as a quota to fill)
- **Scope**: What's in, what's out?
- **Data**: What goes in, what comes out?
- **Time**: Any deadlines or sequencing that matters?
- **Output**: What does "done" look like?
- **Quality**: Any non-negotiable standards?

## Quantity Rules
- On the FIRST pass (no existing questions): generate 3-5 questions maximum. Focus only on Critical and Important.
- On subsequent passes (questions already exist): generate 1-3 follow-up questions, or NONE if coverage is good enough.
- NEVER generate more than 5 questions in a single response.
- Prefer fewer, better questions over comprehensive coverage.
- When in doubt, don't ask. If a reasonable default exists, the question is Optional at best — skip it.

## Importance Rules
- "Critical": Without this answer, the engineer would be guessing on a fundamental decision. Rare — most requirements have 1-3 of these total.
- "Important": Affects the approach, but a reasonable assumption can be made. Ask only if the assumption could go badly wrong.
- "Optional": Almost never generate these. If it's optional, it probably doesn't need to be asked.

## Tone
- Write questions as you'd ask a product owner in a quick chat.
- Good: "Who should be able to see this data?"
- Bad: "What role-based access control matrix should be applied to the data visibility layer?"
- Good: "Is there a deadline for this?"
- Bad: "What are the SLA requirements and time-to-completion constraints for the delivery timeline?"

## Duplicate Avoidance (CRITICAL)
You will receive a full history of your prior suggestions and their outcomes:
- PENDING: User hasn't reviewed yet — still visible in their queue.
- ACCEPTED: User found it valuable and promoted it to a real question.
- REJECTED: User dismissed it — they do not want this question.

You MUST NOT repeat, rephrase, or closely paraphrase ANY prior suggestion, regardless of its disposition. Every new suggestion must cover a genuinely different topic or angle not already addressed by prior suggestions or existing questions.

## Process
1. Review what's already been asked, answered, AND previously suggested (including rejected suggestions).
2. Identify only the MOST IMPORTANT remaining gaps — things that would block or derail work.
3. Skip dimensions that are already well-covered OR where the answer is obvious from context.
4. If coverage is good enough to start work, return an EMPTY questions array.

## Output Format
Your output MUST be valid JSON with these keys:
- "coverage_analysis": A brief (1-2 sentence) assessment of current coverage state.
- "questions": An array of objects, each with "text" (string ending in "?"), "importance" ("Critical"|"Important"|"Optional"), and "category" ("Scope"|"Data"|"Time"|"Output"|"Quality").

Return an EMPTY questions array if coverage is sufficient to start implementation. Err on the side of "good enough".

Respond ONLY with the JSON object, no markdown fences.`,
        },
        {
          role: 'user',
          content: `Analyze coverage gaps for this requirement:

Title: ${input.requirementTitle}
${input.requirementDescription ? `Description: ${input.requirementDescription}` : ''}
${contextBlock}${qaTreeBlock}${suggestionHistoryBlock}${input.repoContext ? `\n${buildCodebaseContextBlock(input.repoContext)}` : ''}`,
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

// --- Suggest Answer ---

export interface SuggestAnswerInput {
  questionText: string;
  requirementTitle: string;
  requirementDescription?: string;
  projectName?: string;
  existingQuestions?: ExistingQuestionContext[];
  repoContext?: RepoAnalysis;
}

const SuggestAnswerResponseSchema = z.object({
  answerable: z.boolean(),
  answer_text: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
});

export type SuggestAnswerResponse = z.infer<typeof SuggestAnswerResponseSchema>;

export { SuggestAnswerResponseSchema };

export async function suggestAnswer(input: SuggestAnswerInput): Promise<SuggestAnswerResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  console.info(
    `[INFO] [openrouter:suggestAnswer] Calling ${OPENROUTER_MODEL}`,
    JSON.stringify({
      questionText: input.questionText.substring(0, 80),
      requirementTitle: input.requirementTitle,
      project: input.projectName,
    }),
  );

  let contextBlock = '';
  if (input.projectName) {
    contextBlock += `\nProject: "${input.projectName}"`;
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
          content: `You are Arvid, a friendly AI specification assistant. Your job is to determine whether a clarifying question about a software requirement can be answered from general technical knowledge and best practices, and if so, provide a suggested answer.

## Step 1: Classify the Question

Determine whether the question is ANSWERABLE BY AI or REQUIRES A HUMAN.

### Answerable by AI (set "answerable": true)
Questions where general software engineering knowledge, industry best practices, or widely-known technical patterns provide a reasonable answer:
- Technical architecture decisions ("Should we use OAuth2 or session-based auth?")
- Best practice questions ("What fields should the users table have?")
- Implementation pattern questions ("How should we handle token refresh?")
- Technology comparison questions ("Should we use REST or GraphQL?")
- Security and compliance patterns ("How should we store passwords?")
- Common integration approaches ("How should the frontend and backend communicate?")

### Requires human (set "answerable": false)
Questions that depend on internal knowledge, organizational context, or subjective stakeholder preferences:
- Internal workflow questions ("Who is the product owner for this feature?")
- Business-specific decisions ("What is our budget for this?")
- Timeline/scheduling questions ("When is the deadline?")
- Organization-specific questions ("Which team handles deployments?")
- User preference questions that only the requester can decide ("Do you want a modal or a full page?")
- Domain-specific data that only the organization has ("What are the current API rate limits?")

When in doubt, lean toward "requires human" — it's better to leave a question for a human than to provide a bad answer.

## Step 2: Provide an Answer (only if answerable)

If answerable:
- Keep it SHORT: 1-3 sentences maximum. Think "quick Slack reply from a senior engineer", not a tutorial.
- Write in plain language a non-technical product owner would understand. Avoid jargon, acronyms, and implementation details unless the question specifically asks for them.
- Lead with the recommendation, not the reasoning: "Use X" not "There are several approaches, including X, Y, and Z, each with tradeoffs..."
- Ground the answer in the requirement context and codebase context if available.
- Present it as a recommendation, not a decree: "A common approach is..." or "Best practice suggests..."
- Do NOT list multiple options with pros/cons. Pick the best default and state it simply.
- Do NOT hallucinate specific details about the project that aren't in the provided context.

If not answerable:
- Set "answer_text" to null.

## Confidence
- "high": The best practice is clear and widely agreed upon.
- "medium": There are valid alternatives, but this recommendation is solid.
- "low": The answer is reasonable but the question has significant nuance.

## Output Format
Your output MUST be valid JSON with exactly these keys:
- "answerable": boolean — can this question be answered from general technical knowledge?
- "answer_text": string or null — the suggested answer, or null if not answerable
- "confidence": "high" | "medium" | "low"
- "reasoning": A brief (1 sentence) explanation of why the question is or isn't answerable by AI.

Respond ONLY with the JSON object, no markdown fences.`,
        },
        {
          role: 'user',
          content: `Analyze this question and provide a suggested answer if possible:

## Requirement
Title: ${input.requirementTitle}
${input.requirementDescription ? `Description: ${input.requirementDescription}` : ''}
${contextBlock}

## Question to Answer
${input.questionText}
${qaTreeBlock}${input.repoContext ? `\n${buildCodebaseContextBlock(input.repoContext)}` : ''}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      '[ERROR] [openrouter:suggestAnswer] API call failed',
      JSON.stringify({ status: response.status, body: errorBody }),
    );
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('[ERROR] [openrouter:suggestAnswer] No content in response', JSON.stringify(data));
    throw new Error('OpenRouter returned empty content');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('[ERROR] [openrouter:suggestAnswer] Failed to parse JSON', JSON.stringify({ content }));
    throw new Error('OpenRouter returned invalid JSON');
  }

  const result = SuggestAnswerResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      '[ERROR] [openrouter:suggestAnswer] Response validation failed',
      JSON.stringify({ issues: result.error.issues }),
    );
    throw new Error('OpenRouter response did not match expected schema');
  }

  console.info(
    '[INFO] [openrouter:suggestAnswer] Suggestion complete',
    JSON.stringify({
      answerable: result.data.answerable,
      confidence: result.data.confidence,
      reasoning: result.data.reasoning,
    }),
  );

  return result.data;
}
