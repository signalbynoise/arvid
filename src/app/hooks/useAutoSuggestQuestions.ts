import { useEffect, useMemo } from 'react';
import { useStore, selectSelectedReqId, selectQuestions, selectRequirements, selectIsSuggestingQuestions } from '../store';

export function useAutoSuggestQuestions() {
  const selectedReqId = useStore(selectSelectedReqId);
  const allQuestions = useStore(selectQuestions);
  const requirements = useStore(selectRequirements);
  const isSuggesting = useStore(selectIsSuggestingQuestions);
  const suggestQuestions = useStore(s => s.suggestQuestions);

  const isImplemented = useMemo(
    () => requirements.find(r => r.id === selectedReqId)?.implStatus === 'Implemented',
    [requirements, selectedReqId],
  );

  useEffect(() => {
    if (!selectedReqId || isSuggesting || isImplemented) return;
    const reqQuestions = allQuestions.filter(q => q.requirementId === selectedReqId);
    if (reqQuestions.length === 0) {
      suggestQuestions(selectedReqId);
    }
  }, [selectedReqId, allQuestions.length, isSuggesting, isImplemented, suggestQuestions]);
}
