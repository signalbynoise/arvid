import React, { useState, useEffect } from 'react';
import { RequirementColumn } from './components/RequirementColumn';
import { QuestionColumn } from './components/QuestionColumn';
import { AnswerColumn } from './components/AnswerColumn';
import { SummaryColumn } from './components/SummaryColumn';
import { NewRequirementModal } from './components/NewRequirementModal';
import { DetailsModal } from './components/DetailsModal';
import { Sidebar } from './components/Sidebar';
import { LoaderPinwheel, Layers, PanelLeft, AlertTriangle, RotateCw } from 'lucide-react';
import { Requirement, Question } from './types';
import { useStore, selectSelectedReqId, selectSelectedQuestionId, selectDataState, selectSelectedReq, selectReqQuestions } from './store';

export default function App() {
  const dataState = useStore(selectDataState);
  const selectedReqId = useStore(selectSelectedReqId);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const selectedReq = useStore(selectSelectedReq);
  const reqQuestions = useStore(selectReqQuestions);
  const loadEntities = useStore(s => s.loadEntities);
  const cancelLoad = useStore(s => s.cancelLoad);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalType, setDetailsModalType] = useState<'requirement' | 'question' | null>(null);
  const [detailsModalData, setDetailsModalData] = useState<Requirement | Question | null>(null);

  useEffect(() => {
    loadEntities();
    return () => cancelLoad();
  }, [loadEntities, cancelLoad]);

  const requirements = useStore(s => s.requirements);
  const questions = reqQuestions;

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

  if (dataState.status === 'idle' || dataState.status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#08090a] text-[#f7f8f8]">
        <LoaderPinwheel className="animate-spin" size={24} />
      </div>
    );
  }

  if (dataState.status === 'error') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#08090a] text-[#f7f8f8] space-y-4">
        <AlertTriangle size={32} className="text-[#ef4444]" />
        <p className="text-[14px] text-[#8a8f98]">{dataState.error}</p>
        <button
          onClick={() => loadEntities()}
          className="flex items-center space-x-2 px-4 py-2 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] rounded-[6px] text-[13px] font-[510] transition-colors"
        >
          <RotateCw size={14} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen w-full bg-[#08090a] text-[#f7f8f8] antialiased" style={{ fontFeatureSettings: '"cv01", "ss03"' }}>
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-14 border-b border-[rgba(255,255,255,0.05)] flex items-center px-4 bg-[#0f1011] shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-1.5 text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] transition-colors"
              title="Toggle Sidebar"
            >
              <PanelLeft size={16} />
            </button>
          </div>
          <div className="ml-auto flex items-center">
            <button className="h-7 w-7 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.05)] text-[12px] font-[510] text-[#f7f8f8] flex items-center justify-center hover:bg-[rgba(255,255,255,0.15)] transition-colors">
              U
            </button>
          </div>
        </header>

        <main className="flex-1 flex w-full min-h-0 overflow-hidden bg-[#0f1011]">
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
                <div className="w-1/4 h-full border-r border-[rgba(255,255,255,0.05)] bg-[#0f1011]" />
              )}
              <SummaryColumn />
            </>
          ) : (
            <div className="flex-1 bg-[#0f1011] flex flex-col items-center justify-center text-[#62666d]">
              <Layers size={48} className="mb-4 opacity-10" />
              <p className="text-[14px]">Select a requirement to view its knowledge flow.</p>
            </div>
          )}
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
