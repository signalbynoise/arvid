import { describe, it, expect } from 'vitest';
import { isSemanticallyDuplicate } from './textSimilarity';

describe('isSemanticallyDuplicate', () => {
  const existing = [
    'Who should be able to see this data?',
    'What is the expected response time for the API?',
    'Is there a specific deadline or timeline for this feature?',
    'How should validation errors be displayed to the user?',
  ];

  it('detects exact duplicates', () => {
    expect(isSemanticallyDuplicate('Who should be able to see this data?', existing))
      .toBe('Who should be able to see this data?');
  });

  it('detects case-insensitive duplicates', () => {
    expect(isSemanticallyDuplicate('who should be able to see this data?', existing))
      .toBe('Who should be able to see this data?');
  });

  it('detects synonym-based paraphrases', () => {
    expect(isSemanticallyDuplicate(
      'Who should have access to view this data?', existing,
    )).not.toBeNull();
  });

  it('detects reworded API question', () => {
    expect(isSemanticallyDuplicate(
      'What response time should users expect from the API?', existing,
    )).not.toBeNull();
  });

  it('detects reworded deadline question', () => {
    expect(isSemanticallyDuplicate(
      'What is the deadline or timeline for delivering this feature?', existing,
    )).not.toBeNull();
  });

  it('detects superset questions (existing is subset of candidate)', () => {
    expect(isSemanticallyDuplicate(
      'How should validation errors be displayed to the user in the form?', existing,
    )).not.toBeNull();
  });

  it('does not flag genuinely different questions', () => {
    expect(isSemanticallyDuplicate(
      'What database should we use for storage?', existing,
    )).toBeNull();
  });

  it('does not flag questions on different topics', () => {
    expect(isSemanticallyDuplicate(
      'How should errors be reported to the monitoring system?', existing,
    )).toBeNull();
  });

  it('returns null for empty existing list', () => {
    expect(isSemanticallyDuplicate('What database should we use?', [])).toBeNull();
  });

  it('skips very short questions to avoid false positives', () => {
    expect(isSemanticallyDuplicate('Why?', ['Why not?'])).toBeNull();
  });

  it('detects rearranged word order', () => {
    expect(isSemanticallyDuplicate(
      'For the API, what response time is expected?', existing,
    )).not.toBeNull();
  });

  it('handles within-batch dedup (same text as candidate)', () => {
    const batch = ['What metrics should we track for performance?'];
    expect(isSemanticallyDuplicate(
      'What performance metrics should we track?', batch,
    )).not.toBeNull();
  });
});
