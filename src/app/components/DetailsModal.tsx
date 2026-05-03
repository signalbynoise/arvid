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
          <h3 className="text-[#8a8f98] text-[12px] uppercase tracking-wider mb-2 font-[510]">
            {isReq ? 'Title' : 'Question'}
          </h3>
          <p className="text-[#f7f8f8] text-[15px] font-[400] leading-snug">{displayTitle}</p>
        </div>

        {(description || isReq) && (
          <div>
            <h3 className="text-[#8a8f98] text-[12px] uppercase tracking-wider mb-2 font-[510]">
              Description
            </h3>
            <p className="text-[#d0d6e0] text-[14px] leading-relaxed">
              {description || "No detailed description provided."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#8a8f98]">
              <User size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-[#8a8f98] uppercase tracking-wider font-[510]">Author</span>
              <span className="block text-[13px] text-[#f7f8f8] mt-0.5">{authorName || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#8a8f98]">
              <Calendar size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-[#8a8f98] uppercase tracking-wider font-[510]">Date</span>
              <span className="block text-[13px] text-[#f7f8f8] mt-0.5">{createdAt || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#8a8f98]">
              <Users size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-[#8a8f98] uppercase tracking-wider font-[510]">Team</span>
              <span className="block text-[13px] text-[#f7f8f8] mt-0.5">{authorTeam || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#8a8f98]">
              <Briefcase size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-[#8a8f98] uppercase tracking-wider font-[510]">Role</span>
              <span className="block text-[13px] text-[#f7f8f8] mt-0.5">{authorRole || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
