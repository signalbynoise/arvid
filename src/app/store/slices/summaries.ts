import { StateCreator } from 'zustand';
import { Summary } from '../../types';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:summaries');

export type SummaryDataStatus = 'idle' | 'loading' | 'ready' | 'error' | 'generating';

export interface SummaryDataState {
  status: SummaryDataStatus;
  error?: string;
}

export interface SummariesSlice {
  summary: Summary | null;
  summaryDataState: SummaryDataState;

  loadSummary: (requirementId: string) => Promise<void>;
  generateSummary: (requirementId: string) => Promise<void>;
  clearSummary: () => void;
}

export const createSummariesSlice: StateCreator<SummariesSlice, [], [], SummariesSlice> = (set) => ({
  summary: null,
  summaryDataState: { status: 'idle' },

  loadSummary: async (requirementId: string) => {
    set({ summaryDataState: { status: 'loading' } });
    log.info('loadSummary', 'Fetching cached summary', { requirementId });

    try {
      const summary = await api.getSummary(requirementId);
      set({
        summary,
        summaryDataState: { status: 'ready' },
      });
      log.info('loadSummary', 'Summary loaded', { requirementId, found: !!summary });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ summaryDataState: { status: 'error', error: message } });
      log.error('loadSummary', 'Failed to load summary', { error: message });
    }
  },

  generateSummary: async (requirementId: string) => {
    set({ summaryDataState: { status: 'generating' } });
    log.info('generateSummary', 'Generating summary via AI', { requirementId });

    try {
      const summary = await api.generateSummary(requirementId);
      set({
        summary,
        summaryDataState: { status: 'ready' },
      });
      log.info('generateSummary', 'Summary generated', { requirementId, summaryId: summary.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ summaryDataState: { status: 'error', error: message } });
      log.error('generateSummary', 'Failed to generate summary', { error: message });
    }
  },

  clearSummary: () => {
    set({ summary: null, summaryDataState: { status: 'idle' } });
  },
});
