import { StateCreator } from 'zustand';
import { logger } from '../../logger';

const log = logger.create('store:ui');

export type ModalIntent =
  | 'createProject'
  | 'createRequirement'
  | 'createQuestion'
  | 'createAnswer'
  | 'createWorkspace'
  | 'createTeam'
  | 'inviteMember'
  | 'renameEntity'
  | 'connectGitHub'
  | 'connectLinear'
  | 'disconnectGitHub'
  | 'disconnectLinear'
  | 'connectSlack'
  | 'disconnectSlack'
  | 'slackChannelPicker';

export interface PendingModal {
  type: ModalIntent;
  data?: unknown;
}

export interface UISlice {
  commandPaletteOpen: boolean;
  pendingModal: PendingModal | null;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  requestModal: (intent: ModalIntent, data?: unknown) => void;
  clearPendingModal: () => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set, get) => ({
  commandPaletteOpen: false,
  pendingModal: null,

  openCommandPalette: () => {
    set({ commandPaletteOpen: true });
    log.debug('openCommandPalette', 'Palette opened');
  },

  closeCommandPalette: () => {
    set({ commandPaletteOpen: false });
    log.debug('closeCommandPalette', 'Palette closed');
  },

  toggleCommandPalette: () => {
    const next = !get().commandPaletteOpen;
    set({ commandPaletteOpen: next });
    log.debug('toggleCommandPalette', next ? 'Palette opened' : 'Palette closed');
  },

  requestModal: (intent: ModalIntent, data?: unknown) => {
    set({ pendingModal: { type: intent, data }, commandPaletteOpen: false });
    log.info('requestModal', 'Modal requested', { intent });
  },

  clearPendingModal: () => {
    set({ pendingModal: null });
  },
});
