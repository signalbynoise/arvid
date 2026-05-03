import React from 'react';
import { Requirement, Question } from '../types';
import { Calendar, User, Users, Briefcase } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'requirement' | 'question' | null;
  data: Requirement | Question | null;
}

export function DetailsModal({ isOpen, onClose, type, data }: Props) {
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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isReq ? 'Requirement Details' : 'Question Details'} size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-text-tertiary text-[12px] uppercase tracking-wider mb-2 font-[var(--fw-medium)]">
            {isReq ? 'Title' : 'Question'}
          </h3>
          <p className="text-text-primary text-[15px] font-[var(--fw-regular)] leading-snug">{displayTitle}</p>
        </div>

        {(description || isReq) && (
          <div>
            <h3 className="text-text-tertiary text-[12px] uppercase tracking-wider mb-2 font-[var(--fw-medium)]">
              Description
            </h3>
            <p className="text-text-secondary text-[14px] leading-relaxed">
              {description || "No detailed description provided."}
            </p>
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
