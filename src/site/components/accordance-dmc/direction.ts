import type { DmcDirection, DmcRule } from '../mini-demo/dmc-types';
import { LISA } from '../mini-demo/actors';

// ── State ────────────────────────────────────────────────────

export type AccordanceStep =
  | 'idle'
  | 'focus'
  | 'open'
  | 'confidence'
  | 'accordance'
  | 'dimensions'
  | 'hold'
  | 'close';

export interface AccordanceState {
  step: AccordanceStep;
  scenarioIndex: number;
  cycleCount: number;
}

// ── Content Pool ─────────────────────────────────────────────

export interface Scenario {
  requirement: { title: string; shortId: string; owner: string; completeness: number };
  confidence: number;
  dimensions: {
    objective: boolean;
    architecture: boolean;
    constraints: boolean;
    risks: boolean;
  };
}

export interface AccordancePool {
  scenarios: Scenario[];
}

// ── Actor ────────────────────────────────────────────────────


// ── Rules ────────────────────────────────────────────────────

type R = DmcRule<AccordanceState, AccordancePool>;

const focusRule: R = {
  actor: LISA.id,
  canExecute: (s) => s.step === 'idle',
  execute: () => ({
    actor: LISA.id,
    verb: 'focus',
    subject: 'impl-chip',
    stateUpdate: (prev) => ({ ...prev, step: 'focus' as const }),
  }),
};

const openRule: R = {
  actor: LISA.id,
  canExecute: (s) => s.step === 'focus',
  execute: () => ({
    actor: LISA.id,
    verb: 'open',
    subject: 'impl-modal',
    stateUpdate: (prev) => ({ ...prev, step: 'open' as const }),
  }),
};

const showConfidenceRule: R = {
  actor: LISA.id,
  canExecute: (s) => s.step === 'open',
  execute: () => ({
    actor: LISA.id,
    verb: 'evaluate',
    subject: 'confidence',
    stateUpdate: (prev) => ({ ...prev, step: 'confidence' as const }),
  }),
};

const showAccordanceRule: R = {
  actor: LISA.id,
  canExecute: (s) => s.step === 'confidence',
  execute: () => ({
    actor: LISA.id,
    verb: 'evaluate',
    subject: 'accordance',
    stateUpdate: (prev) => ({ ...prev, step: 'accordance' as const }),
  }),
};

const showDimensionsRule: R = {
  actor: LISA.id,
  canExecute: (s) => s.step === 'accordance',
  execute: () => ({
    actor: LISA.id,
    verb: 'detail',
    subject: 'dimensions',
    stateUpdate: (prev) => ({ ...prev, step: 'dimensions' as const }),
  }),
};

const holdRule: R = {
  actor: LISA.id,
  canExecute: (s) => s.step === 'dimensions',
  execute: () => ({
    actor: LISA.id,
    verb: 'review',
    subject: 'analysis',
    stateUpdate: (prev) => ({ ...prev, step: 'hold' as const }),
  }),
};

const closeRule: R = {
  actor: LISA.id,
  canExecute: (s) => s.step === 'hold',
  execute: () => ({
    actor: LISA.id,
    verb: 'close',
    subject: 'impl-modal',
    stateUpdate: (prev) => ({ ...prev, step: 'close' as const }),
  }),
};

// ── Content Pool ─────────────────────────────────────────────

const contentPool: AccordancePool = {
  scenarios: [
    {
      requirement: { title: 'API Authentication Middleware', shortId: 'REQ-42', owner: 'Sarah K.', completeness: 92 },
      confidence: 94,
      dimensions: { objective: true, architecture: true, constraints: true, risks: false },
    },
    {
      requirement: { title: 'Database Migration Pipeline', shortId: 'REQ-78', owner: 'David L.', completeness: 78 },
      confidence: 87,
      dimensions: { objective: true, architecture: true, constraints: false, risks: true },
    },
    {
      requirement: { title: 'Real-time Notification System', shortId: 'REQ-15', owner: 'Sarah K.', completeness: 100 },
      confidence: 96,
      dimensions: { objective: true, architecture: true, constraints: true, risks: true },
    },
    {
      requirement: { title: 'Role-based Access Control', shortId: 'REQ-91', owner: 'David L.', completeness: 65 },
      confidence: 72,
      dimensions: { objective: true, architecture: false, constraints: true, risks: false },
    },
  ],
};

// ── Direction ────────────────────────────────────────────────

const INITIAL_STATE: AccordanceState = {
  step: 'idle',
  scenarioIndex: 0,
  cycleCount: 0,
};

export const accordanceDirection: DmcDirection<AccordanceState, AccordancePool> = {
  goal: (s) => s.step === 'close',
  actors: [LISA],
  rules: [focusRule, openRule, showConfidenceRule, showAccordanceRule, showDimensionsRule, holdRule, closeRule],
  contentPool,
  initialState: INITIAL_STATE,
  resetCycle: (state) => ({
    ...INITIAL_STATE,
    scenarioIndex: (state.scenarioIndex + 1) % contentPool.scenarios.length,
    cycleCount: state.cycleCount + 1,
  }),
};
