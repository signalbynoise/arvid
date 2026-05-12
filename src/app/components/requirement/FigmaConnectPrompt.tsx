import React from 'react';
import { FormField } from '../ui/FormField';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('FigmaConnectPrompt');

export function FigmaConnectPrompt() {
  const handleConnect = async () => {
    log.info('connect', 'Initiating Figma OAuth from requirement modal');
    try {
      const { url } = await api.getFigmaAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get Figma auth URL', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  };

  return (
    <FormField label="Figma Links" hint="Enrich your requirements with design files">
      <button
        onClick={handleConnect}
        className="w-full h-10 flex items-center justify-center gap-2 rounded-comfortable border border-border-default bg-surface-frost-02 text-text-primary text-caption hover:bg-surface-frost-04 transition-colors"
      >
        <img src="/figma.svg" alt="" className="w-3.5 h-3.5" />
        <span>Connect to Figma</span>
      </button>
    </FormField>
  );
}
