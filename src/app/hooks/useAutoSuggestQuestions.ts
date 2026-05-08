import { useEffect } from 'react';
import { useStore, selectSelectedReqId, selectQuestions, selectIsSuggestingQuestions } from '../store';

export function useAutoSuggestQuestions() {
  const selectedReqId = useStore(selectSelectedReqId);
  const allQuestions = useStore(selectQuestions);
  const isSuggesting = useStore(selectIsSuggestingQuestions);
  const suggestQuestions = useStore(s => s.suggestQuestions);

  useEffect(() => {
    if (!selectedReqId || isSuggesting) return;
    const reqQuestions = allQuestions.filter(q => q.requirementId === selectedReqId);
    if (reqQuestions.length === 0) {
      suggestQuestions(selectedReqId);
    }
  }, [selectedReqId, allQuestions.length, isSuggesting, suggestQuestions]);
}
