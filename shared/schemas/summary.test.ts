import { describe, it, expect } from 'vitest';
import { SummaryRowSchema, SummarySchema, GenerateSummaryResponseSchema } from './summary';

describe('SummaryRowSchema', () => {
  const validRow = {
    id: 's1',
    requirement_id: 'r1',
    synthesis: 'A synthesis.',
    core_objective: 'An objective.',
    architecture: 'Architecture details.',
    constraints: 'Some constraints.',
    unverified_risks: 'Some risks.',
    model: 'x-ai/grok-4.1-fast',
    generated_at: '2026-05-03T14:00:00.000Z',
  };

  it('accepts a valid summary row', () => {
    const result = SummaryRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('rejects missing requirement_id', () => {
    const { requirement_id, ...noReqId } = validRow;
    const result = SummaryRowSchema.safeParse(noReqId);
    expect(result.success).toBe(false);
  });
});

describe('SummarySchema (transform)', () => {
  it('transforms snake_case to camelCase', () => {
    const row = {
      id: 's1',
      requirement_id: 'r1',
      synthesis: 'Synth',
      core_objective: 'Obj',
      architecture: 'Arch',
      constraints: 'Con',
      unverified_risks: 'Risk',
      model: 'test-model',
      generated_at: '2026-01-01',
    };
    const result = SummarySchema.parse(row);
    expect(result.requirementId).toBe('r1');
    expect(result.coreObjective).toBe('Obj');
    expect(result.unverifiedRisks).toBe('Risk');
    expect(result.generatedAt).toBe('2026-01-01');
  });
});

describe('GenerateSummaryResponseSchema', () => {
  it('accepts a valid AI response', () => {
    const response = {
      synthesis: 'A synthesis.',
      core_objective: 'An objective.',
      architecture: 'Architecture.',
      constraints: 'Constraints.',
      unverified_risks: 'Risks.',
    };
    const result = GenerateSummaryResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('rejects missing fields', () => {
    const result = GenerateSummaryResponseSchema.safeParse({ synthesis: 'Only one field' });
    expect(result.success).toBe(false);
  });
});
