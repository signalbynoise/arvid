import type { DmcDirection, DmcRule } from '../mini-demo/dmc-types';
import { EMILY } from '../mini-demo/actors';

// ── State ────────────────────────────────────────────────────

export type SlackStep =
  | 'idle'
  | 'focus-slack'
  | 'channels'
  | 'focus-process'
  | 'loading'
  | 'hold'
  | 'close';

export interface SlackState {
  step: SlackStep;
  scenarioIndex: number;
  cycleCount: number;
}

// ── Content Pool ─────────────────────────────────────────────

export interface SlackScenario {
  channels: string[];
  loadingMessage: string;
}

export interface SlackPool {
  scenarios: SlackScenario[];
}

// ── Rules ────────────────────────────────────────────────────

type R = DmcRule<SlackState, SlackPool>;

const focusSlackRule: R = {
  actor: EMILY.id,
  canExecute: (s) => s.step === 'idle',
  execute: () => ({
    actor: EMILY.id,
    verb: 'focus',
    subject: 'slack-source',
    stateUpdate: (prev) => ({ ...prev, step: 'focus-slack' as const }),
  }),
};

const openChannelsRule: R = {
  actor: EMILY.id,
  canExecute: (s) => s.step === 'focus-slack',
  execute: () => ({
    actor: EMILY.id,
    verb: 'open',
    subject: 'slack-channels',
    stateUpdate: (prev) => ({ ...prev, step: 'channels' as const }),
  }),
};

const focusProcessRule: R = {
  actor: EMILY.id,
  canExecute: (s) => s.step === 'channels',
  execute: () => ({
    actor: EMILY.id,
    verb: 'focus',
    subject: 'process-btn',
    stateUpdate: (prev) => ({ ...prev, step: 'focus-process' as const }),
  }),
};

const startLoadingRule: R = {
  actor: EMILY.id,
  canExecute: (s) => s.step === 'focus-process',
  execute: () => ({
    actor: EMILY.id,
    verb: 'process',
    subject: 'slack-channel',
    stateUpdate: (prev) => ({ ...prev, step: 'loading' as const }),
  }),
};

const holdRule: R = {
  actor: EMILY.id,
  canExecute: (s) => s.step === 'loading',
  execute: () => ({
    actor: EMILY.id,
    verb: 'review',
    subject: 'analysis',
    stateUpdate: (prev) => ({ ...prev, step: 'hold' as const }),
  }),
};

const closeRule: R = {
  actor: EMILY.id,
  canExecute: (s) => s.step === 'hold',
  execute: () => ({
    actor: EMILY.id,
    verb: 'close',
    subject: 'modal',
    stateUpdate: (prev) => ({ ...prev, step: 'close' as const }),
  }),
};

// ── Content Pool ─────────────────────────────────────────────

const contentPool: SlackPool = {
  scenarios: [
    {
      channels: ['#arvid-notifications', '#arvid-discussions', '#general', '#development', '#mobile-app-development'],
      loadingMessage: 'Arvid is analyzing your channel',
    },
    {
      channels: ['#engineering', '#product-updates', '#design-reviews', '#deployments'],
      loadingMessage: 'Arvid is extracting requirements from Slack',
    },
    {
      channels: ['#backend-team', '#api-discussions', '#incidents', '#standups', '#retrospectives'],
      loadingMessage: 'Arvid is processing conversation threads',
    },
  ],
};

// ── Direction ────────────────────────────────────────────────

const INITIAL_STATE: SlackState = {
  step: 'idle',
  scenarioIndex: 0,
  cycleCount: 0,
};

export const slackDirection: DmcDirection<SlackState, SlackPool> = {
  goal: (s) => s.step === 'close',
  actors: [EMILY],
  rules: [focusSlackRule, openChannelsRule, focusProcessRule, startLoadingRule, holdRule, closeRule],
  contentPool,
  initialState: INITIAL_STATE,
  resetCycle: (state) => ({
    ...INITIAL_STATE,
    scenarioIndex: (state.scenarioIndex + 1) % contentPool.scenarios.length,
    cycleCount: state.cycleCount + 1,
  }),
  tickDelay: 1200,
  tickJitter: 450,
};
