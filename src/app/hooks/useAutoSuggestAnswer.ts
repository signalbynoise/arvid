import { useEffect, useMemo } from 'react';
import { useStore, selectAnswers, selectSelectedQuestionId, selectIsSuggestingAnswer, selectIsAnswerSuggestionSkipped } from '../store';

export function useAutoSuggestAnswer() {
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const allAnswers = useStore(selectAnswers);
  const isSuggesting = useStore(selectIsSuggestingAnswer);
  const isSkipped = useStore(selectIsAnswerSuggestionSkipped);
  const suggestAnswer = useStore(s => s.suggestAnswer);

  const answersForQuestion = useMemo(
    () => allAnswers.filter(a => a.questionId === selectedQuestionId),
    [allAnswers, selectedQuestionId],
  );

  useEffect(() => {
    if (!selectedQuestionId || isSuggesting || isSkipped) return;
    if (answersForQuestion.length === 0) {
      suggestAnswer(selectedQuestionId);
    }
  }, [selectedQuestionId, answersForQuestion.length, isSuggesting, isSkipped, suggestAnswer]);
}
