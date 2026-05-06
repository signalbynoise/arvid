import React from 'react';
import { Answer } from '../types';
import { CardShell } from './CardShell';
import { Button } from './Button';

interface Props {
  answer: Answer;
  onUse: (id: string) => void;
  onHide: (id: string) => void;
}

export function SuggestedAnswerCard({ answer, onUse, onHide }: Props) {
  return (
    <CardShell id={`answer-${answer.id}`} variant="suggested">
      <div className="flex items-center justify-between">
        <span className="text-tiny font-mono text-text-quaternary">{answer.shortId || 'A01'}</span>
      </div>

      <p className="text-text-quaternary">{answer.text}</p>

      <div className="flex items-center gap-2">
        <Button onClick={() => onUse(answer.id)}>Use</Button>
        <Button onClick={() => onHide(answer.id)}>Hide</Button>
      </div>
    </CardShell>
  );
}
