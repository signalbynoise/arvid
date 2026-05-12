import React, { useState, useEffect, useCallback } from 'react';
import { Image, Trash2, ExternalLink, Loader2, Plus } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { api } from '../../api';
import type { FigmaDesignLink } from '../../api';
import { isValidFigmaUrl } from '../../../../shared/figmaUrl';
import { useStore } from '../../store';
import { logger } from '../../logger';

const log = logger.create('DesignFilesTab');

interface Props {
  requirementId: string;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export function DesignFilesTab({ requirementId }: Props) {
  const figmaConnection = useStore(s => s.figmaConnection);
  const [links, setLinks] = useState<FigmaDesignLink[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async (): Promise<FigmaDesignLink[] | null> => {
    setLoadState('loading');
    try {
      const data = await api.getRequirementFigmaLinks(requirementId);
      setLinks(data);
      setLoadState('ready');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('fetchLinks', 'Failed to load design links', { error: message });
      setLoadState('error');
      return null;
    }
  }, [requirementId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    fetchLinks().then((data) => {
      if (data && data.some(l => !l.fetchedAt)) {
        timer = setTimeout(() => { fetchLinks(); }, 3000);
      }
    });
    return () => clearTimeout(timer);
  }, [fetchLinks]);

  const handleAdd = async () => {
    const trimmed = newUrl.trim();
    if (!trimmed || !isValidFigmaUrl(trimmed)) {
      setError('Enter a valid Figma design URL');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      await api.addRequirementFigmaLink(requirementId, trimmed);
      setNewUrl('');
      log.info('handleAdd', 'Design link added', { requirementId });
      await fetchLinks();
      setTimeout(() => { fetchLinks(); }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('handleAdd', 'Failed to add design link', { error: message });
      setError('Failed to add link');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (linkId: string) => {
    setRemovingId(linkId);
    try {
      await api.removeRequirementFigmaLink(requirementId, linkId);
      setLinks(prev => prev.filter(l => l.id !== linkId));
      log.info('handleRemove', 'Design link removed', { linkId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('handleRemove', 'Failed to remove design link', { error: message });
    } finally {
      setRemovingId(null);
    }
  };

  const isConnected = figmaConnection.status === 'connected';

  if (loadState === 'loading') {
    return (
      <div className="p-5 flex items-center justify-center min-h-[200px]">
        <Loader2 size={ICON_SIZE.xl} className="animate-spin text-text-quaternary" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6">
      {links.length > 0 && (
        <FormField label={`Linked Designs (${links.length})`}>
          <div className="space-y-2">
            {links.map(link => (
              <DesignLinkRow
                key={link.id}
                link={link}
                isRemoving={removingId === link.id}
                onRemove={() => handleRemove(link.id)}
              />
            ))}
          </div>
        </FormField>
      )}

      {links.length === 0 && loadState === 'ready' && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Image size={ICON_SIZE['2xl']} className="text-text-empty" />
          <p className="text-caption-lg text-text-empty">No design files linked yet</p>
        </div>
      )}

      {isConnected && (
        <FormField label="Add Figma Link" error={error}>
          <div className="flex gap-2">
            <div className="flex-1">
              <TextInput
                value={newUrl}
                onChange={(val) => { setNewUrl(val); setError(null); }}
                placeholder="Paste a Figma design URL..."
                type="url"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={isAdding || !newUrl.trim()}
              className="btn-primary shrink-0 flex items-center gap-1.5"
            >
              {isAdding ? (
                <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
              ) : (
                <Plus size={ICON_SIZE.sm} />
              )}
              Add
            </button>
          </div>
        </FormField>
      )}

      {!isConnected && (
        <div className="p-3 rounded-card border border-border-default bg-surface-frost-02">
          <p className="text-caption-lg text-text-tertiary">
            Connect your Figma account in Settings to add design links.
          </p>
        </div>
      )}
    </div>
  );
}

interface DesignLinkRowProps {
  link: FigmaDesignLink;
  isRemoving: boolean;
  onRemove: () => void;
}

function DesignLinkRow({ link, isRemoving, onRemove }: DesignLinkRowProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-card border border-border-default bg-surface-frost-02 group">
      <a
        href={link.figmaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-comfortable border border-border-default bg-surface-panel overflow-hidden shrink-0 flex items-center justify-center hover:border-border-hover transition-colors"
      >
        {link.thumbnailUrl ? (
          <img
            src={link.thumbnailUrl}
            alt={link.nodeName ?? 'Design'}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image size={ICON_SIZE.md} className="text-text-quaternary" />
        )}
      </a>

      <div className="flex-1 min-w-0">
        <p className="text-caption-lg text-text-primary truncate">
          {link.nodeName ?? 'Untitled'}
        </p>
        <p className="text-label-sm text-text-quaternary truncate">
          {link.fileKey}{link.nodeId ? ` / ${link.nodeId}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={link.figmaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-text-quaternary hover:text-text-primary transition-colors"
          title="Open in Figma"
        >
          <ExternalLink size={ICON_SIZE.sm} />
        </a>
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className="p-1.5 text-text-quaternary hover:text-status-error transition-colors"
          title="Remove"
        >
          {isRemoving ? (
            <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
          ) : (
            <Trash2 size={ICON_SIZE.sm} />
          )}
        </button>
      </div>
    </div>
  );
}
