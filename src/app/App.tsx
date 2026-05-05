import React, { useState, useEffect, useMemo } from 'react';
import { RequirementColumn } from './components/RequirementColumn';
import { QuestionColumn } from './components/QuestionColumn';
import { AnswerColumn } from './components/AnswerColumn';
import { SummaryColumn } from './components/SummaryColumn';
import { NewRequirementModal } from './components/NewRequirementModal';
import { DetailsModal } from './components/DetailsModal';
import { Sidebar } from './components/Sidebar';
import { UserMenu } from './components/UserMenu';
import { LoaderPinwheel, Layers, PanelLeft, AlertTriangle, RotateCw, Folder } from 'lucide-react';
import { Requirement, Question } from './types';
import { useStore, selectSelectedReqId, selectSelectedQuestionId, selectDataState, selectRequirements, selectQuestions, selectSelectedProjectId } from './store';

export default function App() {
  const dataState = useStore(selectDataState);
  const selectedReqId = useStore(selectSelectedReqId);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const requirements = useStore(selectRequirements);
  const questions = useStore(selectQuestions);
  const loadEntities = useStore(s => s.loadEntities);
  const cancelLoad = useStore(s => s.cancelLoad);
  const loadGitHubStatus = useStore(s => s.loadGitHubStatus);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('github_connected') || params.has('github_error')) {
      window.history.replaceState({}, '', window.location.pathname);
      if (params.has('github_connected')) {
        loadGitHubStatus();
      }
    }
  }, [loadGitHubStatus]);

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
  const [detailsModalType, setDetailsModalType] = useState<'requirement' | 'question' | null>(null);
  const [detailsModalData, setDetailsModalData] = useState<Requirement | Question | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      loadEntities(selectedProjectId);
    }
    return () => cancelLoad();
  }, [selectedProjectId, loadEntities, cancelLoad]);


  const openDetails = (type: 'requirement' | 'question', id: string) => {
    setDetailsModalType(type);
    if (type === 'requirement') {
      const r = requirements.find(req => req.id === id);
      if (r) setDetailsModalData(r);
    } else {
      const q = questions.find(qu => qu.id === id);
      if (q) setDetailsModalData(q);
    }
    setDetailsModalOpen(true);
  };

  const renderMainContent = () => {
    if (!selectedProjectId) {
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
          <button
            onClick={() => loadEntities(selectedProjectId)}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-frost-08 hover:bg-surface-frost-12 rounded-comfortable text-[13px] font-[var(--fw-medium)] transition-colors"
          >
            <RotateCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    return (
      <>
        <RequirementColumn 
          onNewReqClick={() => setIsModalOpen(true)}
          onOpenDetails={(id) => openDetails('requirement', id)}
        />
        {selectedReqId ? (
          <>
            <QuestionColumn 
              onOpenDetails={(id) => openDetails('question', id)}
            />
            {selectedQuestionId ? (
              <AnswerColumn />
            ) : (
              <div className="w-1/4 h-full border-r border-border-subtle bg-surface-panel" />
            )}
            <SummaryColumn />
          </>
        ) : (
          <div className="flex-1 bg-surface-panel flex flex-col items-center justify-center text-text-quaternary">
            <Layers size={48} className="mb-4 opacity-10" />
            <p className="text-[14px]">Select a requirement to view its knowledge flow.</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-row h-screen w-full bg-surface-base text-text-primary antialiased">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-14 border-b border-border-subtle flex items-center px-4 bg-surface-panel shrink-0 z-30">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-frost-08 rounded-comfortable transition-colors"
              title="Toggle Sidebar"
            >
              <PanelLeft size={16} />
            </button>
          </div>
          <div className="ml-auto flex items-center">
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 flex w-full min-h-0 overflow-hidden bg-surface-panel">
          {renderMainContent()}
        </main>

        <NewRequirementModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
        <DetailsModal 
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          type={detailsModalType}
          data={detailsModalData}
        />
      </div>
    </div>
  );
}
