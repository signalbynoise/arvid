import React from 'react';
import { Answer } from '../types';
import { Card } from './ui/Card';
import { Button } from './Button';

interface Props {
  answer: Answer;
  onUse: (id: string) => void;
  onHide: (id: string) => void;
}

export function SuggestedAnswerCard({ answer, onUse, onHide }: Props) {
  return (
    <Card id={`answer-${answer.id}`} variant="suggested">
      <Card.Header shortId={answer.shortId || 'A01'} />

      <p className="text-text-quaternary">{answer.text}</p>

      <div className="flex items-center gap-2">
        <Button onClick={() => onUse(answer.id)}>Use</Button>
        <Button onClick={() => onHide(answer.id)}>Hide</Button>
      </div>
    </Card>
  );
}
