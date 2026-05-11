import type { DmcDirection, DmcRule } from '../mini-demo/dmc-types';
import { ALEX } from '../mini-demo/actors';

// ── State ────────────────────────────────────────────────────

export type SupabaseStep =
  | 'idle'
  | 'focus'
  | 'dropdown'
  | 'select'
  | 'loading'
  | 'hold'
  | 'close';

export interface SupabaseState {
  step: SupabaseStep;
  scenarioIndex: number;
  cycleCount: number;
}

// ── Content Pool ─────────────────────────────────────────────

export interface SupabaseScenario {
  databaseName: string;
  loadingMessage: string;
}

export interface SupabasePool {
  scenarios: SupabaseScenario[];
}

// ── Rules ────────────────────────────────────────────────────

type R = DmcRule<SupabaseState, SupabasePool>;

const focusRule: R = {
  actor: ALEX.id,
  canExecute: (s) => s.step === 'idle',
  execute: () => ({
    actor: ALEX.id,
    verb: 'focus',
    subject: 'database-trigger',
    stateUpdate: (prev) => ({ ...prev, step: 'focus' as const }),
  }),
};

const openDropdownRule: R = {
  actor: ALEX.id,
  canExecute: (s) => s.step === 'focus',
  execute: () => ({
    actor: ALEX.id,
    verb: 'open',
    subject: 'database-menu',
    stateUpdate: (prev) => ({ ...prev, step: 'dropdown' as const }),
  }),
};

const selectDatabaseRule: R = {
  actor: ALEX.id,
  canExecute: (s) => s.step === 'dropdown',
  execute: () => ({
    actor: ALEX.id,
    verb: 'select',
    subject: 'database',
    stateUpdate: (prev) => ({ ...prev, step: 'select' as const }),
  }),
};

const startLoadingRule: R = {
  actor: ALEX.id,
  canExecute: (s) => s.step === 'select',
  execute: () => ({
    actor: ALEX.id,
    verb: 'analyze',
    subject: 'database',
    stateUpdate: (prev) => ({ ...prev, step: 'loading' as const }),
  }),
};

const holdRule: R = {
  actor: ALEX.id,
  canExecute: (s) => s.step === 'loading',
  execute: () => ({
    actor: ALEX.id,
    verb: 'review',
    subject: 'analysis',
    stateUpdate: (prev) => ({ ...prev, step: 'hold' as const }),
  }),
};

const closeRule: R = {
  actor: ALEX.id,
  canExecute: (s) => s.step === 'hold',
  execute: () => ({
    actor: ALEX.id,
    verb: 'close',
    subject: 'modal',
    stateUpdate: (prev) => ({ ...prev, step: 'close' as const }),
  }),
};

// ── Content Pool ─────────────────────────────────────────────

const contentPool: SupabasePool = {
  scenarios: [
    { databaseName: 'Arvid', loadingMessage: 'Arvid is analyzing your database' },
    { databaseName: 'Acme Prod', loadingMessage: 'Arvid is scanning tables and policies' },
    { databaseName: 'Staging', loadingMessage: 'Arvid is mapping schema dependencies' },
    { databaseName: 'Analytics', loadingMessage: 'Arvid is indexing edge functions' },
  ],
};

// ── Direction ────────────────────────────────────────────────

const INITIAL_STATE: SupabaseState = {
  step: 'idle',
  scenarioIndex: 0,
  cycleCount: 0,
};

export const supabaseDirection: DmcDirection<SupabaseState, SupabasePool> = {
  goal: (s) => s.step === 'close',
  actors: [ALEX],
  rules: [focusRule, openDropdownRule, selectDatabaseRule, startLoadingRule, holdRule, closeRule],
  contentPool,
  initialState: INITIAL_STATE,
  resetCycle: (state) => ({
    ...INITIAL_STATE,
    scenarioIndex: (state.scenarioIndex + 1) % contentPool.scenarios.length,
    cycleCount: state.cycleCount + 1,
  }),
  tickDelay: 1100,
  tickJitter: 500,
};
