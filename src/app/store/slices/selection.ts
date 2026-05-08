import { StateCreator } from 'zustand';
import { logger } from '../../logger';

const log = logger.create('store:selection');

export interface SelectionSlice {
  selectedReqId: string | null;
  selectedQuestionId: string | null;
  selectedProjectId: string | null;

  selectRequirement: (id: string | null) => void;
  selectQuestion: (id: string | null) => void;
  setSelectedProjectId: (id: string) => void;
}

export const createSelectionSlice: StateCreator<SelectionSlice, [], [], SelectionSlice> = (set, get) => ({
  selectedReqId: null,
  selectedQuestionId: null,
  selectedProjectId: null,

  selectRequirement: (id: string | null) => {
    if (id === null) {
      set({ selectedReqId: null, selectedQuestionId: null });
      log.debug('selectRequirement', 'Cleared requirement selection');
      return;
    }
    const current = get().selectedReqId;
    if (id === current) {
      set({ selectedReqId: null, selectedQuestionId: null });
      log.debug('selectRequirement', 'Deselected requirement', { id });
    } else {
      set({ selectedReqId: id, selectedQuestionId: null });
      log.debug('selectRequirement', 'Selected requirement', { id });
    }
  },

  selectQuestion: (id: string | null) => {
    if (id === null) {
      set({ selectedQuestionId: null });
      log.debug('selectQuestion', 'Cleared question selection');
      return;
    }
    const current = get().selectedQuestionId;
    const next = id === current ? null : id;
    set({ selectedQuestionId: next });
    log.debug('selectQuestion', 'Selection changed', { id: next });
  },

  setSelectedProjectId: (id: string) => {
    set({ selectedProjectId: id, selectedReqId: null, selectedQuestionId: null });
    log.debug('setSelectedProjectId', 'Project changed', { id });
  },
});
