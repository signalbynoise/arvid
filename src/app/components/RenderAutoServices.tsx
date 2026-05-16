import React, { useEffect } from 'react';
import { Loader2, Server } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore } from '../store';

const STATUS_DOT: Record<string, string> = {
  live: 'bg-status-success',
  deploy_failed: 'bg-status-error',
  not_deployed: 'bg-status-warning',
  unknown: 'bg-border-subtle',
};

const STATUS_LABEL: Record<string, string> = {
  live: 'Live',
  deploy_failed: 'Failed',
  not_deployed: 'Deploying',
  unknown: 'Unknown',
};

interface RenderAutoServicesProps {
  projectId: string;
  hasRepo: boolean;
}

export function RenderAutoServices({ projectId, hasRepo }: RenderAutoServicesProps) {
  const projectRenderServices = useStore(s => s.projectRenderServices);
  const projectServicesStatus = useStore(s => s.projectServicesStatus);
  const projectServicesMatched = useStore(s => s.projectServicesMatched);
  const loadProjectServices = useStore(s => s.loadProjectServices);

  useEffect(() => {
    if (hasRepo) {
      loadProjectServices(projectId);
    }
  }, [projectId, hasRepo, loadProjectServices]);

  if (!hasRepo) {
    return (
      <span className="text-caption-lg text-text-quaternary">
        Link a repository first
      </span>
    );
  }

  if (projectServicesStatus === 'loading') {
    return (
      <div className="flex items-center gap-2 py-1">
        <Loader2 size={ICON_SIZE.sm} className="animate-spin text-text-quaternary" />
        <span className="text-caption-lg text-text-quaternary">Discovering services...</span>
      </div>
    );
  }

  if (!projectServicesMatched || projectRenderServices.length === 0) {
    return (
      <span className="text-caption-lg text-text-quaternary">
        No matching services
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {projectRenderServices.map(svc => {
        const dotClass = STATUS_DOT[svc.deployStatus] ?? STATUS_DOT.unknown;
        const label = STATUS_LABEL[svc.deployStatus] ?? svc.deployStatus;

        return (
          <div key={svc.id} className="flex items-center gap-2 text-caption-lg">
            <Server size={ICON_SIZE.sm} className="text-text-quaternary shrink-0" />
            <span className="text-text-secondary truncate">{svc.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} title={label} />
            <span className="text-text-quaternary">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
