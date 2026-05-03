import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../api';

type Importance = 'Critical' | 'Important' | 'Optional';
type Category = 'Scope' | 'Data' | 'Time' | 'Output' | 'Quality';

const DEBOUNCE_MS = 1000;
const MIN_LENGTH = 10;

export interface ClassificationState {
  importance: Importance;
  category: Category;
  isClassifying: boolean;
  hasAutoClassified: boolean;
  setImportance: (value: Importance) => void;
  setCategory: (value: Category) => void;
  onTextChange: (text: string) => void;
  reset: () => void;
}

export function useQuestionClassification(requirementId: string | null): ClassificationState {
  const [importance, setImportanceState] = useState<Importance>('Important');
  const [category, setCategoryState] = useState<Category>('Scope');
  const [isClassifying, setIsClassifying] = useState(false);
  const [hasAutoClassified, setHasAutoClassified] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const classify = useCallback(async (text: string) => {
    if (!requirementId || text.trim().length < MIN_LENGTH) return;

    setIsClassifying(true);
    try {
      const result = await api.classifyQuestion(text.trim(), requirementId);
      setImportanceState(result.importance as Importance);
      setCategoryState(result.category as Category);
      setHasAutoClassified(true);
    } catch {
      /* keep current values on failure */
    } finally {
      setIsClassifying(false);
    }
  }, [requirementId]);

  const onTextChange = useCallback((text: string) => {
    setHasAutoClassified(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (text.trim().length >= MIN_LENGTH) {
      timeoutRef.current = setTimeout(() => classify(text), DEBOUNCE_MS);
    }
  }, [classify]);

  const setImportance = useCallback((value: Importance) => {
    setImportanceState(value);
    setHasAutoClassified(false);
  }, []);

  const setCategory = useCallback((value: Category) => {
    setCategoryState(value);
    setHasAutoClassified(false);
  }, []);

  const reset = useCallback(() => {
    setImportanceState('Important');
    setCategoryState('Scope');
    setIsClassifying(false);
    setHasAutoClassified(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { importance, category, isClassifying, hasAutoClassified, setImportance, setCategory, onTextChange, reset };
}
