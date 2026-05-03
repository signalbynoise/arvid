import { StateCreator } from 'zustand';
import { logger } from '../../logger';

const log = logger.create('store:selection');

export interface SelectionSlice {
  selectedReqId: string | null;
  selectedQuestionId: string | null;
  selectedProjectId: string;

  selectRequirement: (id: string) => void;
  selectQuestion: (id: string) => void;
  setSelectedProjectId: (id: string) => void;
}

export const createSelectionSlice: StateCreator<SelectionSlice, [], [], SelectionSlice> = (set, get) => ({
  selectedReqId: null,
  selectedQuestionId: null,
  selectedProjectId: 'p1',

  selectRequirement: (id: string) => {
    const current = get().selectedReqId;
    if (id === current) {
      set({ selectedReqId: null, selectedQuestionId: null });
      log.debug('selectRequirement', 'Deselected requirement', { id });
    } else {
      set({ selectedReqId: id, selectedQuestionId: null });
      log.debug('selectRequirement', 'Selected requirement', { id });
    }
  },

  selectQuestion: (id: string) => {
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
