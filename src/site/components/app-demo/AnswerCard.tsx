import { LoaderPinwheel } from 'lucide-react';
import { MiniCard, MiniCardHeader, MiniCardBody, MiniCardMeta, MiniIndicatorDot, MiniStatusChip, MiniStatusLabel } from '../mini-demo';
import type { Answer } from './types';

interface AnswerCardProps {
  answer: Answer;
  visible: boolean;
}

export function AnswerCard({ answer, visible }: AnswerCardProps) {
  return (
    <MiniCard
      visible={visible}
      emphasis={answer.isCurrent}
      dimmed={visible && !answer.isCurrent ? 'soft' : false}
      connectors={visible ? ['left'] : []}
    >
      <MiniCardHeader shortId={answer.shortId} />
      <MiniCardBody>{answer.text}</MiniCardBody>

      <MiniStatusChip
        icon={LoaderPinwheel}
        iconColor={answer.isCurrent ? 'text-text-primary' : 'text-text-quaternary'}
      >
        <MiniStatusLabel
          active={answer.isCurrent}
          activeClass="text-text-primary"
          inactiveClass="text-text-tertiary"
        >
          {answer.isCurrent ? 'Active Answer' : 'Mark Active'}
        </MiniStatusLabel>
      </MiniStatusChip>

      <MiniCardMeta text={`${answer.author} - ${answer.createdAt}`}>
        <MiniIndicatorDot color="bg-indicator-high" />
      </MiniCardMeta>
    </MiniCard>
  );
}
