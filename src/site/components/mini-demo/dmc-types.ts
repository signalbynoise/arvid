import type { Actor } from './types';

export type { Actor };

export interface DmcTransition<S> {
  actor: string;
  verb: string;
  subject: string;
  stateUpdate: (prev: S) => S;
}

export interface DmcRule<S, P = unknown> {
  actor: string;
  weight?: number;
  canExecute: (state: S) => boolean;
  execute: (state: S, pool: P) => DmcTransition<S>;
}

export interface DmcDirection<S, P = unknown> {
  goal: (state: S) => boolean;
  actors: Actor[];
  rules: DmcRule<S, P>[];
  contentPool: P;
  initialState: S;
  resetCycle: (state: S) => S;
  tickDelay?: number;
  tickJitter?: number;
  startDelay?: number;
}

export interface DmcEngineOutput<S> {
  state: S;
  currentTransition: DmcTransition<S> | null;
  activeActor: string | null;
}
