import React, { useState } from 'react';
import { Requirement, Question } from '../types';
import { Calendar, User, Users, Briefcase, Pencil, Trash2, Check, X } from 'lucide-react';
import { useStore } from '../store';
import { BaseModal } from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'requirement' | 'question' | null;
  data: Requirement | Question | null;
}

export function DetailsModal({ isOpen, onClose, type, data }: Props) {
  const updateRequirement = useStore(s => s.updateRequirement);
  const deleteRequirement = useStore(s => s.deleteRequirement);
  const deleteQuestion = useStore(s => s.deleteQuestion);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!data || !type) return null;

  const isReq = type === 'requirement';
  const req = data as Requirement;
  const q = data as Question;

  const displayTitle = isReq ? req.title : q.text;
  const authorName = isReq ? req.owner : q.author;
  const authorTeam = isReq ? req.ownerTeam : q.authorTeam;
  const authorRole = isReq ? req.ownerRole : q.authorRole;
  const createdAt = isReq ? req.createdAt : q.createdAt;
  const description = isReq ? req.description : q.description;

  const handleStartEdit = () => {
    setEditTitle(req.title);
    setEditDescription(req.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    await updateRequirement(req.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditDescription('');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    if (isReq) {
      await deleteRequirement(req.id);
    } else {
      await deleteQuestion(q.id);
    }
    setIsDeleting(false);
    setConfirmDelete(false);
    onClose();
  };

  const handleClose = () => {
    setIsEditing(false);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={isReq ? 'Requirement Details' : 'Question Details'} size="lg">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-text-tertiary text-[12px] uppercase tracking-wider font-[var(--fw-medium)]">
              {isReq ? 'Title' : 'Question'}
            </h3>
            {!isEditing && (
              <div className="flex items-center gap-1">
                {isReq && (
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 rounded-standard text-text-tertiary hover:text-text-primary hover:bg-surface-frost-08 transition-all"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-standard text-text-tertiary hover:text-status-error hover:bg-surface-frost-08 transition-all"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-surface-frost-02 border border-border-default rounded-comfortable px-3 py-2 text-[15px] text-text-primary focus:outline-none focus:border-border-focus transition-all"
            />
          ) : (
            <p className="text-text-primary text-[15px] font-[var(--fw-regular)] leading-snug">{displayTitle}</p>
          )}
        </div>

        {confirmDelete && (
          <div className="flex items-center justify-between p-3 rounded-card border border-status-error-border-focus bg-[rgba(212,24,61,0.08)]">
            <p className="text-[13px] text-status-error font-[var(--fw-medium)]">
              {isReq
                ? 'Delete this requirement and all its questions, answers, and summaries?'
                : 'Delete this question and all its answers?'}
            </p>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button onClick={() => setConfirmDelete(false)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="btn-primary">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {(description || isReq) && (
          <div>
            <h3 className="text-text-tertiary text-[12px] uppercase tracking-wider mb-2 font-[var(--fw-medium)]">
              Description
            </h3>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full h-40 bg-surface-frost-02 border border-border-default rounded-card p-3 text-[13px] text-text-primary focus:outline-none focus:border-border-focus transition-all resize-none"
              />
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-card border border-border-subtle bg-surface-frost-02 p-3">
                <p className="text-text-secondary text-[13px] leading-relaxed whitespace-pre-wrap">
                  {description || "No detailed description provided."}
                </p>
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end gap-2">
            <button onClick={handleCancelEdit} className="btn-ghost flex items-center gap-1.5">
              <X size={14} />
              Cancel
            </button>
            <button onClick={handleSaveEdit} disabled={!editTitle.trim()} className="btn-primary flex items-center gap-1.5">
              <Check size={14} />
              Save
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
              <User size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-text-tertiary uppercase tracking-wider font-[var(--fw-medium)]">Author</span>
              <span className="block text-[13px] text-text-primary mt-0.5">{authorName || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
              <Calendar size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-text-tertiary uppercase tracking-wider font-[var(--fw-medium)]">Date</span>
              <span className="block text-[13px] text-text-primary mt-0.5">{createdAt || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
              <Users size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-text-tertiary uppercase tracking-wider font-[var(--fw-medium)]">Team</span>
              <span className="block text-[13px] text-text-primary mt-0.5">{authorTeam || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
              <Briefcase size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-text-tertiary uppercase tracking-wider font-[var(--fw-medium)]">Role</span>
              <span className="block text-[13px] text-text-primary mt-0.5">{authorRole || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
