import React, { useState, useEffect } from 'react';
import { Requirement, Question, Answer } from '../types';
import { Users, Pencil, Info, Image, Lightbulb, AlertTriangle, CircleCheck, Settings, Link2 } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { scrollToRequirement } from '../domain/scrollToRequirement';
import { useStore, selectMembers, selectCardAssignees, selectSimilarities } from '../store';
import { BaseModal } from './BaseModal';
import { ModalSidebar, ModalSidebarItem } from './ui/ModalSidebar';
import { ModalFooter } from './ui/ModalFooter';
import { SubmitButton } from './ui/SubmitButton';
import { DesignFilesTab } from './requirement/DesignFilesTab';
import { GeneralTab } from './details-modal/GeneralTab';
import { UsersTab } from './details-modal/UsersTab';
import { MetadataTab } from './details-modal/MetadataTab';
import { CompletenessTab } from './details-modal/CompletenessTab';
import { PropertiesTab } from './details-modal/PropertiesTab';
import { ClarityTab } from './details-modal/ClarityTab';
import { RiskTab } from './details-modal/RiskTab';
import { RelatedRequirements } from './details-modal/RelatedRequirements';

type TabId = 'general' | 'design' | 'users' | 'metadata' | 'related' | 'properties' | 'completeness' | 'clarity' | 'risk';

const BASE_TABS: ModalSidebarItem[] = [
  { id: 'general', label: 'General', icon: <Pencil size={ICON_SIZE.sm} /> },
  { id: 'users', label: 'Users', icon: <Users size={ICON_SIZE.sm} /> },
  { id: 'metadata', label: 'Metadata', icon: <Info size={ICON_SIZE.sm} /> },
];

const DESIGN_TAB: ModalSidebarItem = {
  id: 'design',
  label: 'Design Files',
  icon: <Image size={ICON_SIZE.sm} />,
};

const COMPLETENESS_TAB: ModalSidebarItem = {
  id: 'completeness',
  label: 'Completeness',
  icon: <CircleCheck size={ICON_SIZE.sm} />,
};

const CLARITY_TAB: ModalSidebarItem = {
  id: 'clarity',
  label: 'Clarity',
  icon: <Lightbulb size={ICON_SIZE.sm} />,
};

const RISK_TAB: ModalSidebarItem = {
  id: 'risk',
  label: 'Risk',
  icon: <AlertTriangle size={ICON_SIZE.sm} />,
};

const RELATED_TAB: ModalSidebarItem = {
  id: 'related',
  label: 'Related',
  icon: <Link2 size={ICON_SIZE.sm} />,
};

const PROPERTIES_TAB: ModalSidebarItem = {
  id: 'properties',
  label: 'Properties',
  icon: <Settings size={ICON_SIZE.sm} />,
};

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
  const similarities = useStore(selectSimilarities);
  const assignUser = useStore(s => s.assignUser);
  const unassignUser = useStore(s => s.unassignUser);

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isReq = type === 'requirement';
  const isQuestion = type === 'question';

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
  }, [data, type, isReq, isQuestion]);

  if (!data || !type) return null;

  const req = data as Requirement;
  const q = data as Question;
  const ans = data as Answer;

  const authorName = isReq ? req.owner : isQuestion ? q.author : ans.author;
  const authorTeam = isReq ? req.ownerTeam : isQuestion ? q.authorTeam : undefined;
  const authorRole = isReq ? req.ownerRole : isQuestion ? q.authorRole : undefined;
  const createdAt = isReq ? req.createdAt : isQuestion ? q.createdAt : ans.createdAt;

  const assigneeKey = `${type}:${data.id}`;
  const assignees = allAssignees[assigneeKey] || [];

  const modalTitle = isReq
    ? 'Requirement Details'
    : isQuestion
      ? 'Question Details'
      : 'Answer Details';

  const originalTitle = isReq ? req.title : isQuestion ? q.text : ans.text;
  const originalDescription = isReq ? (req.description || '') : isQuestion ? (q.description || '') : '';
  const hasChanges = title.trim() !== originalTitle || description.trim() !== originalDescription;

  const visibleTabs = isReq
    ? [BASE_TABS[0], DESIGN_TAB, BASE_TABS[1], BASE_TABS[2], RELATED_TAB, COMPLETENESS_TAB, CLARITY_TAB, RISK_TAB]
    : isQuestion
      ? [...BASE_TABS, PROPERTIES_TAB]
      : BASE_TABS;

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
    const assignedUserIds = new Set(assignees.map(a => a.userId));
    if (assignedUserIds.has(userId)) {
      const assignee = assignees.find(a => a.userId === userId);
      if (assignee) unassignUser(assignee.id, type!, data.id);
    } else {
      assignUser(type!, data.id, userId);
    }
  };

  const handleSelectRelated = (id: string) => {
    handleClose();
    scrollToRequirement(id);
  };

  const reqSimilarities = isReq ? (similarities[req.id] ?? []) : [];

  const sidebar = (
    <ModalSidebar
      items={visibleTabs}
      activeId={activeTab}
      onSelect={(id) => setActiveTab(id as TabId)}
    />
  );

  const deleteButton = (
    <button
      onClick={() => setConfirmDelete(true)}
      disabled={confirmDelete}
      className="btn-ghost text-text-tertiary hover:text-status-error"
    >
      Delete
    </button>
  );

  const modalFooter = activeTab === 'general' ? (
    <ModalFooter back={deleteButton}>
      <button onClick={handleClose} className="btn-ghost">Cancel</button>
      <SubmitButton
        onClick={handleSave}
        disabled={!hasChanges || !title.trim()}
        label="Save"
        loadingLabel="Saving..."
        isLoading={isSaving}
      />
    </ModalFooter>
  ) : undefined;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="xl" sidebar={sidebar} footer={modalFooter}>
      {activeTab === 'general' && (
        <GeneralTab
          type={type}
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          confirmDelete={confirmDelete}
          onConfirmDelete={setConfirmDelete}
          isDeleting={isDeleting}
          onDelete={handleDelete}
          isCurrent={type === 'answer' ? ans.isCurrent : undefined}
        />
      )}
      {activeTab === 'design' && isReq && <DesignFilesTab requirementId={req.id} />}
      {activeTab === 'users' && (
        <UsersTab
          authorName={authorName}
          authorUserId={isReq ? req.createdBy : isQuestion ? q.createdBy : ans.createdBy}
          assignees={assignees}
          members={members}
          onToggleAssign={handleToggleAssign}
          onUnassign={(assigneeId) => unassignUser(assigneeId, type!, data.id)}
        />
      )}
      {activeTab === 'metadata' && (
        <MetadataTab
          type={type}
          data={data}
          authorName={authorName}
          authorTeam={authorTeam}
          authorRole={authorRole}
          createdAt={createdAt}
        />
      )}
      {activeTab === 'related' && isReq && (
        <div className="p-5">
          <RelatedRequirements
            similarities={reqSimilarities}
            onSelect={handleSelectRelated}
          />
          {reqSimilarities.length === 0 && (
            <p className="text-caption-lg text-text-empty text-center py-6">
              No related requirements found.
            </p>
          )}
        </div>
      )}
      {activeTab === 'properties' && isQuestion && (
        <PropertiesTab question={q} />
      )}
      {activeTab === 'completeness' && isReq && (
        <CompletenessTab requirement={req} />
      )}
      {activeTab === 'clarity' && isReq && (
        <ClarityTab requirement={req} />
      )}
      {activeTab === 'risk' && isReq && (
        <RiskTab requirement={req} />
      )}
    </BaseModal>
  );
}
