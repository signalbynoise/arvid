-- Add LLM-computed numeric risk and clarity scores to requirements.
-- Existing enum columns (clarity, risk) are preserved for backward compatibility;
-- when scores are present the enum value is derived from the numeric score.

ALTER TABLE public.requirements
  ADD COLUMN clarity_score SMALLINT CHECK (clarity_score BETWEEN 1 AND 10),
  ADD COLUMN risk_score    SMALLINT CHECK (risk_score BETWEEN 1 AND 10),
  ADD COLUMN clarity_reasoning TEXT,
  ADD COLUMN risk_reasoning    TEXT,
  ADD COLUMN scores_computed_at TIMESTAMPTZ;
