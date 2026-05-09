import React, { useState, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { RequirementColumn } from './components/RequirementColumn';
import { QuestionColumn } from './components/QuestionColumn';
import { AnswerColumn } from './components/AnswerColumn';
import { SummaryColumn } from './components/SummaryColumn';
import { NewRequirementModal } from './components/NewRequirementModal';
import { DetailsModal } from './components/DetailsModal';
import { AddUserPopover } from './components/AddUserPopover';
import { CommandPalette } from './components/command-palette/CommandPalette';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoaderPinwheel, AlertTriangle, RotateCw, Folder } from 'lucide-react';
import { Requirement, Question, Answer, EntityType } from './types';
import { useStore, selectSelectedReqId, selectSelectedQuestionId, selectDataState, selectRequirements, selectQuestions, selectAnswers, selectSelectedProjectId, selectPendingModal, selectCardAssignees } from './store';
import { COLUMN_CLASSES } from './components/ColumnShell';
import { SlackChannelPicker } from './components/SlackChannelPicker';
import { EmptyStateSuggestions } from './components/EmptyStateSuggestions';
import { supabase } from './lib/supabase';

export default function App() {
  const dataState = useStore(selectDataState);
  const selectedReqId = useStore(selectSelectedReqId);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const requirements = useStore(selectRequirements);
  const questions = useStore(selectQuestions);
  const answers = useStore(selectAnswers);
  const cardAssignees = useStore(selectCardAssignees);
  const loadEntities = useStore(s => s.loadEntities);
  const fetchCardAssignees = useStore(s => s.fetchCardAssignees);
  const assignUser = useStore(s => s.assignUser);
  const unassignUser = useStore(s => s.unassignUser);
  const deactivateEntity = useStore(s => s.deactivateEntity);
  const refreshRequirements = useStore(s => s.refreshRequirements);
  const cancelLoad = useStore(s => s.cancelLoad);
  const loadGitHubStatus = useStore(s => s.loadGitHubStatus);
  const loadLinearStatus = useStore(s => s.loadLinearStatus);
  const loadSlackStatus = useStore(s => s.loadSlackStatus);
  const loadSupabaseConnectStatus = useStore(s => s.loadSupabaseConnectStatus);
  const pendingModal = useStore(selectPendingModal);
  const clearPendingModal = useStore(s => s.clearPendingModal);
  const openCommandPalette = useStore(s => s.openCommandPalette);
  const requestModal = useStore(s => s.requestModal);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('github_connected') || params.has('github_error')) {
      window.history.replaceState({}, '', window.location.pathname);
      if (params.has('github_connected')) {
        loadGitHubStatus();
      }
    }
    if (params.has('linear_connected') || params.has('linear_error')) {
      window.history.replaceState({}, '', window.location.pathname);
      if (params.has('linear_connected')) {
        loadLinearStatus();
      }
    }
    if (params.has('slack_connected') || params.has('slack_error')) {
      window.history.replaceState({}, '', window.location.pathname);
      if (params.has('slack_connected')) {
        loadSlackStatus();
      }
    }
    if (params.has('supabase_connected') || params.has('supabase_connect_error')) {
      window.history.replaceState({}, '', window.location.pathname);
      if (params.has('supabase_connected')) {
        loadSupabaseConnectStatus();
      }
    }
  }, [loadGitHubStatus, loadLinearStatus, loadSlackStatus, loadSupabaseConnectStatus]);

  useEffect(() => {
    if (!selectedProjectId || dataState.status !== 'ready') return;

    const channel = supabase
      .channel('requirements-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requirements' },
        () => {
          refreshRequirements(selectedProjectId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedProjectId, dataState.status, refreshRequirements]);

  const selectedReq = useMemo(
    () => requirements.find(r => r.id === selectedReqId) ?? null,
    [requirements, selectedReqId],
  );
  const reqQuestions = useMemo(
    () => questions.filter(q => q.requirementId === selectedReqId),
    [questions, selectedReqId],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalType, setDetailsModalType] = useState<'requirement' | 'question' | 'answer' | null>(null);
  const [detailsModalData, setDetailsModalData] = useState<Requirement | Question | Answer | null>(null);
  const [isSlackPickerOpen, setIsSlackPickerOpen] = useState(false);
  const [addUserTarget, setAddUserTarget] = useState<{ entityType: EntityType; entityId: string } | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      loadEntities(selectedProjectId);
      fetchCardAssignees(selectedProjectId);
    }
    return () => cancelLoad();
  }, [selectedProjectId, loadEntities, fetchCardAssignees, cancelLoad]);

  useEffect(() => {
    if (pendingModal?.type === 'createRequirement') {
      setIsModalOpen(true);
      clearPendingModal();
    }
    if (pendingModal?.type === 'slackChannelPicker') {
      setIsSlackPickerOpen(true);
      clearPendingModal();
    }
  }, [pendingModal, clearPendingModal]);


  const openDetails = (type: 'requirement' | 'question' | 'answer', id: string) => {
    setDetailsModalType(type);
    if (type === 'requirement') {
      const r = requirements.find(req => req.id === id);
      if (r) setDetailsModalData(r);
    } else if (type === 'question') {
      const q = questions.find(qu => qu.id === id);
      if (q) setDetailsModalData(q);
    } else {
      const a = answers.find(ans => ans.id === id);
      if (a) setDetailsModalData(a);
    }
    setDetailsModalOpen(true);
  };

  const handleAddUser = (entityType: EntityType, entityId: string) => {
    setAddUserTarget({ entityType, entityId });
  };

  const handleDeactivate = (entityType: EntityType, entityId: string) => {
    deactivateEntity(entityType, entityId);
  };

  const projectsDataState = useStore(s => s.projectsDataState);

  const renderMainContent = () => {
    if (!selectedProjectId) {
      const projectsStillResolving = projectsDataState.status === 'idle' || projectsDataState.status === 'loading';
      if (projectsStillResolving) {
        return (
          <div className="flex-1 flex items-center justify-center bg-surface-panel">
            <LoaderPinwheel className="animate-spin" size={24} />
          </div>
        );
      }

      return (
        <div className="flex-1 bg-surface-panel flex flex-col items-center justify-center text-text-quaternary">
          <Folder size={48} className="mb-4 opacity-10" />
          <p className="text-[14px] mb-1">No project selected.</p>
          <p className="text-[13px] text-text-empty">Create your first project from the sidebar to get started.</p>
        </div>
      );
    }

    if (dataState.status === 'idle' || dataState.status === 'loading') {
      return (
        <div className="flex-1 flex items-center justify-center bg-surface-panel">
          <LoaderPinwheel className="animate-spin" size={24} />
        </div>
      );
    }

    if (dataState.status === 'error') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface-panel space-y-4">
          <AlertTriangle size={32} className="text-status-error" />
          <p className="text-[14px] text-text-tertiary">{dataState.error}</p>
          <button onClick={() => loadEntities(selectedProjectId)} className="btn-ghost flex items-center space-x-2">
            <RotateCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    if (requirements.length === 0 && !selectedReqId) {
      return (
        <EmptyStateSuggestions
          onCreateRequirement={() => setIsModalOpen(true)}
          onCreateSubProject={() => requestModal('createProject')}
          onInviteMembers={() => requestModal('inviteMember', { scope: 'project' })}
          onOpenCommandPalette={openCommandPalette}
        />
      );
    }

    return (
      <>
        <RequirementColumn 
          onNewReqClick={() => setIsModalOpen(true)}
          onOpenDetails={(id) => openDetails('requirement', id)}
          onEdit={(id) => openDetails('requirement', id)}
          onAddUser={handleAddUser}
          onDeactivate={handleDeactivate}
        />
        {selectedReqId ? (
          <>
            <QuestionColumn 
              onOpenDetails={(id) => openDetails('question', id)}
              onEdit={(id) => openDetails('question', id)}
              onAddUser={handleAddUser}
              onDeactivate={handleDeactivate}
            />
            {selectedQuestionId ? (
              <AnswerColumn
                onOpenDetails={(id) => openDetails('answer', id)}
                onEdit={(id) => openDetails('answer', id)}
                onAddUser={handleAddUser}
                onDeactivate={handleDeactivate}
              />
            ) : (
              <div className={`${COLUMN_CLASSES} border-r border-border-subtle`} />
            )}
            <SummaryColumn />
          </>
        ) : (
          <EmptyStateSuggestions
            onCreateRequirement={() => setIsModalOpen(true)}
            onCreateSubProject={() => requestModal('createProject')}
            onInviteMembers={() => requestModal('inviteMember', { scope: 'project' })}
            onOpenCommandPalette={openCommandPalette}
          />
        )}
      </>
    );
  };

  return (
    <div className="flex flex-row h-screen w-full overflow-hidden bg-surface-base text-text-primary antialiased">
      <Outlet />
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 min-w-0 flex flex-col h-screen relative">
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        <main className="flex-1 flex w-full min-h-0 overflow-x-auto overflow-y-hidden hide-scrollbar bg-surface-panel">
          {renderMainContent()}
        </main>
      </div>

      <NewRequirementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <DetailsModal 
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        type={detailsModalType}
        data={detailsModalData}
        onAddUser={detailsModalType && detailsModalData ? () => handleAddUser(detailsModalType, detailsModalData.id) : undefined}
      />
      {addUserTarget && (
        <AddUserPopover
          isOpen={true}
          onClose={() => setAddUserTarget(null)}
          entityType={addUserTarget.entityType}
          entityId={addUserTarget.entityId}
          assignees={cardAssignees[`${addUserTarget.entityType}:${addUserTarget.entityId}`] || []}
          onAssign={(userId) => assignUser(addUserTarget.entityType, addUserTarget.entityId, userId)}
          onUnassign={(assigneeId) => unassignUser(assigneeId, addUserTarget.entityType, addUserTarget.entityId)}
        />
      )}
      <SlackChannelPicker
        isOpen={isSlackPickerOpen}
        onClose={() => setIsSlackPickerOpen(false)}
      />
      <CommandPalette />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: 'bg-surface-elevated border border-border-subtle text-text-primary text-[13px] shadow-modal',
        }}
      />
    </div>
  );
}
