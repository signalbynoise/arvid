import React, { useState, useEffect } from 'react';
import { Requirement, Question, Answer } from '../types';
import { Calendar, User, Users, Briefcase, Plus, Pencil, Info } from 'lucide-react';
import { useStore, selectMembers, selectCardAssignees } from '../store';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { TextArea } from './ui/TextArea';

type DetailsTab = 'general' | 'users' | 'details';

const TAB_CONFIG: { id: DetailsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Pencil size={14} /> },
  { id: 'users', label: 'Users', icon: <Users size={14} /> },
  { id: 'details', label: 'Details', icon: <Info size={14} /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'requirement' | 'question' | 'answer' | null;
  data: Requirement | Question | Answer | null;
  onAddUser?: () => void;
}

export function DetailsModal({ isOpen, onClose, type, data, onAddUser }: Props) {
  const updateRequirement = useStore(s => s.updateRequirement);
  const updateQuestionText = useStore(s => s.updateQuestionText);
  const updateAnswerText = useStore(s => s.updateAnswerText);
  const deleteRequirement = useStore(s => s.deleteRequirement);
  const deleteQuestion = useStore(s => s.deleteQuestion);
  const members = useStore(selectMembers);
  const allAssignees = useStore(selectCardAssignees);
  const assignUser = useStore(s => s.assignUser);
  const unassignUser = useStore(s => s.unassignUser);

  const [activeTab, setActiveTab] = useState<DetailsTab>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [userFilter, setUserFilter] = useState('');

  const isReq = type === 'requirement';
  const isQuestion = type === 'question';
  const isAnswer = type === 'answer';

  useEffect(() => {
    if (!data || !type) return;
    if (isReq) {
      setTitle((data as Requirement).title);
      setDescription((data as Requirement).description || '');
    } else if (isQuestion) {
      setTitle((data as Question).text);
      setDescription((data as Question).description || '');
    } else {
      setTitle((data as Answer).text);
      setDescription('');
    }
    setActiveTab('general');
    setConfirmDelete(false);
    setUserFilter('');
  }, [data, type, isReq, isQuestion]);

  if (!data || !type) return null;

  const req = data as Requirement;
  const q = data as Question;
  const ans = data as Answer;

  const authorName = isReq ? req.owner : isQuestion ? q.author : ans.author;
  const authorTeam = isReq ? req.ownerTeam : isQuestion ? q.authorTeam : undefined;
  const authorRole = isReq ? req.ownerRole : isQuestion ? q.authorRole : undefined;
  const createdAt = isReq ? req.createdAt : isQuestion ? q.createdAt : ans.date;

  const assigneeKey = `${type}:${data.id}`;
  const assignees = allAssignees[assigneeKey] || [];
  const assignedUserIds = new Set(assignees.map(a => a.userId));

  const modalTitle = isReq
    ? 'Requirement Details'
    : isQuestion
      ? 'Question Details'
      : 'Answer Details';

  const originalTitle = isReq ? req.title : isQuestion ? q.text : ans.text;
  const originalDescription = isReq ? (req.description || '') : isQuestion ? (q.description || '') : '';
  const hasChanges = title.trim() !== originalTitle || description.trim() !== originalDescription;

  const handleSave = async () => {
    setIsSaving(true);
    if (isReq) {
      await updateRequirement(req.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
    } else if (isQuestion) {
      await updateQuestionText(q.id, title.trim());
    } else {
      await updateAnswerText(ans.id, title.trim());
    }
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    if (isReq) {
      await deleteRequirement(req.id);
    } else if (isQuestion) {
      await deleteQuestion(q.id);
    }
    setIsDeleting(false);
    setConfirmDelete(false);
    onClose();
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  const handleToggleAssign = (userId: string) => {
    if (assignedUserIds.has(userId)) {
      const assignee = assignees.find(a => a.userId === userId);
      if (assignee) unassignUser(assignee.id, type!, data.id);
    } else {
      assignUser(type!, data.id, userId);
    }
  };

  const filteredMembers = userFilter.trim()
    ? members.filter(m => m.email?.toLowerCase().includes(userFilter.toLowerCase()))
    : members;

  const renderGeneralTab = () => (
    <div className="p-5 space-y-6">
      <FormField label={isReq ? 'Title' : isQuestion ? 'Question' : 'Answer'}>
        <TextInput
          value={title}
          onChange={setTitle}
          placeholder={isReq ? 'Requirement title...' : isQuestion ? 'Question text...' : 'Answer text...'}
        />
      </FormField>

      {(isReq || isQuestion) && (
        <FormField label="Description">
          <TextArea
            value={description}
            onChange={setDescription}
            placeholder="Add a detailed description..."
          />
        </FormField>
      )}

      {isAnswer && (
        <FormField label="Status">
          <p className="text-caption-lg text-text-primary py-1">
            {ans.isCurrent ? 'Active Answer' : 'Inactive'}
          </p>
        </FormField>
      )}

      {confirmDelete && (
        <div className="flex items-center justify-between p-3 rounded-card border border-status-error-border-focus bg-[rgba(212,24,61,0.08)]">
          <p className="text-caption-lg text-status-error font-[var(--fw-medium)]">
            {isReq
              ? 'Delete this requirement and all its questions, answers, and summaries?'
              : isQuestion
                ? 'Delete this question and all its answers?'
                : 'Delete this answer?'}
          </p>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={isDeleting} className="btn-primary">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={confirmDelete}
          className="btn-ghost text-text-tertiary hover:text-status-error"
        >
          Delete
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || !title.trim() || isSaving}
            className="btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          Assigned ({assignees.length})
        </span>
        {onAddUser && (
          <button
            onClick={onAddUser}
            className="flex items-center gap-1.5 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors"
          >
            <Plus size={14} />
            <span>Assign</span>
          </button>
        )}
      </div>

      <div className="space-y-1">
        {assignees.length > 0 ? (
          assignees.map(a => {
            const member = members.find(m => m.userId === a.userId);
            const email = member?.email || a.userId;
            return (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded-card bg-surface-frost-02 border border-border-default"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-surface-frost-08 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-[var(--fw-medium)] text-text-primary">
                      {email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-primary truncate">{email}</p>
                </div>
                <button
                  onClick={() => unassignUser(a.id, type!, data.id)}
                  className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard shrink-0"
                  title="Remove"
                >
                  <User size={12} />
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-[13px] text-text-empty text-center py-6">No users assigned yet.</p>
        )}
      </div>

      <div className="pt-4 border-t border-border-subtle space-y-3">
        <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          All Members
        </span>
        <input
          type="text"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          placeholder="Filter members..."
          className="w-full bg-surface-panel border border-border-default rounded-comfortable px-3 py-2 text-caption-lg text-text-primary placeholder:text-text-empty focus:outline-none focus:border-border-focus transition-all"
        />
        <div className="space-y-1 max-h-[240px] overflow-y-auto">
          {filteredMembers.map(member => {
            const isAssigned = assignedUserIds.has(member.userId);
            return (
              <button
                key={member.userId}
                type="button"
                onClick={() => handleToggleAssign(member.userId)}
                className={`w-full flex items-center justify-between p-3 rounded-card border transition-all ${
                  isAssigned
                    ? 'bg-surface-frost-08 border-border-focus'
                    : 'bg-surface-frost-02 border-border-default hover:border-border-focus'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-surface-frost-08 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-[var(--fw-medium)] text-text-primary">
                      {(member.email ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-primary truncate">{member.email ?? 'Unknown'}</p>
                </div>
                {isAssigned && (
                  <span className="text-[11px] font-[var(--fw-medium)] text-text-tertiary px-2 py-0.5 bg-surface-frost-04 rounded-pill shrink-0">
                    Assigned
                  </span>
                )}
              </button>
            );
          })}
          {filteredMembers.length === 0 && (
            <p className="text-[13px] text-text-empty text-center py-4">No members found.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="p-5 space-y-4">
      <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
        Metadata
      </span>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
            <User size={14} />
          </div>
          <div>
            <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Author</span>
            <span className="block text-[13px] text-text-primary mt-0.5">{authorName || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
            <Calendar size={14} />
          </div>
          <div>
            <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Date</span>
            <span className="block text-[13px] text-text-primary mt-0.5">{createdAt || 'Unknown'}</span>
          </div>
        </div>

        {(authorTeam || !isAnswer) && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
              <Users size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Team</span>
              <span className="block text-[13px] text-text-primary mt-0.5">{authorTeam || 'Unknown'}</span>
            </div>
          </div>
        )}

        {(authorRole || !isAnswer) && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-frost-05 flex items-center justify-center text-text-tertiary">
              <Briefcase size={14} />
            </div>
            <div>
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Role</span>
              <span className="block text-[13px] text-text-primary mt-0.5">{authorRole || 'Unknown'}</span>
            </div>
          </div>
        )}
      </div>

      {isReq && (
        <div className="pt-4 border-t border-border-subtle space-y-4">
          <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
            Properties
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Clarity</span>
              <span className="block text-[13px] text-text-primary mt-1">{req.clarity}</span>
            </div>
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Risk</span>
              <span className="block text-[13px] text-text-primary mt-1">{req.risk}</span>
            </div>
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Source</span>
              <span className="block text-[13px] text-text-primary mt-1">{req.source}</span>
            </div>
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Completeness</span>
              <span className="block text-[13px] text-text-primary mt-1">{req.completeness}%</span>
            </div>
          </div>
        </div>
      )}

      {isQuestion && (
        <div className="pt-4 border-t border-border-subtle space-y-4">
          <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
            Properties
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Status</span>
              <span className="block text-[13px] text-text-primary mt-1">{q.status}</span>
            </div>
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Importance</span>
              <span className="block text-[13px] text-text-primary mt-1">{q.importance}</span>
            </div>
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Category</span>
              <span className="block text-[13px] text-text-primary mt-1">{q.category}</span>
            </div>
            <div className="p-3 rounded-card bg-surface-frost-02 border border-border-default">
              <span className="block text-[11px] text-text-quaternary uppercase tracking-wider">Type</span>
              <span className="block text-[13px] text-text-primary mt-1">{q.type}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="xl">
      <div className="flex min-h-[400px]">
        <nav className="w-[160px] border-r border-border-subtle p-2 shrink-0">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-comfortable text-[13px] font-[var(--fw-medium)] transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-surface-frost-08 text-text-primary'
                  : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'details' && renderDetailsTab()}
        </div>
      </div>
    </BaseModal>
  );
}
