import React from 'react';
import { LoaderPinwheel, Upload, Loader2, X } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { canManageTeams } from '../../domain/workspaces';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { DangerZone } from './DangerZone';
import type { WorkspaceRole } from '../../types';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdBy: string;
}

interface GeneralTabProps {
  workspace: Workspace;
  userRole: WorkspaceRole;
  nameValue: string;
  onNameChange: (v: string) => void;
  nameError: string | null;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  logoUploading: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  canLeave: boolean;
  canDelete: boolean;
  onLeaveWorkspace: () => void;
  onDeleteWorkspace: () => void;
}

export function GeneralTab({
  workspace,
  userRole,
  nameValue,
  onNameChange,
  nameError,
  logoInputRef,
  logoUploading,
  onLogoUpload,
  onRemoveLogo,
  canLeave,
  canDelete,
  onLeaveWorkspace,
  onDeleteWorkspace,
}: GeneralTabProps) {

  return (
    <div className="p-5 space-y-8">
      <div className="space-y-3">
        <label className="text-label-upper text-text-tertiary">Logo</label>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-card bg-surface-frost-04 border border-border-default flex items-center justify-center overflow-hidden shrink-0">
            {workspace.logoUrl ? (
              <img src={workspace.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <LoaderPinwheel size={ICON_SIZE.xl} className="text-text-quaternary" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onLogoUpload}
              className="hidden"
            />
            {canManageTeams(userRole) && (
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="btn-ghost flex items-center gap-1.5"
              >
                {logoUploading
                  ? <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
                  : <Upload size={ICON_SIZE.sm} />}
                <span>{logoUploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            )}
            {workspace.logoUrl && canManageTeams(userRole) && (
              <button
                onClick={onRemoveLogo}
                className="p-1.5 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                title="Remove logo"
              >
                <X size={ICON_SIZE.sm} />
              </button>
            )}
          </div>
        </div>
        <p className="text-label text-text-empty">PNG, JPG, WebP or SVG. Max 2 MB.</p>
      </div>

      <FormField label="Workspace Name" error={nameError}>
        <TextInput
          value={nameValue}
          onChange={onNameChange}
          disabled={!canManageTeams(userRole)}
          hasError={!!nameError}
        />
      </FormField>

      <FormField label="Slug">
        <TextInput
          value={workspace.slug}
          onChange={() => {}}
          disabled
        />
      </FormField>

      <DangerZone
        canLeave={canLeave}
        canDelete={canDelete}
        onLeave={onLeaveWorkspace}
        onDelete={onDeleteWorkspace}
      />
    </div>
  );
}
