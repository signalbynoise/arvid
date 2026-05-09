import { LoaderPinwheel } from 'lucide-react';
import { MiniCard, MiniCardHeader, MiniCardTitle, MiniCardMeta, MiniIndicatorDot, MiniStatusChip, MiniStatusLabel, MiniActionButtons, MiniCategoryLabel } from '../mini-demo';
import type { Question } from './types';

interface QuestionCardProps {
  q: Question;
  visible: boolean;
  selected?: boolean;
  suggested?: boolean;
}

const IMPORTANCE_COLORS: Record<string, string> = {
  Critical: 'bg-indicator-high',
  Important: 'bg-indicator-medium',
  Low: 'bg-indicator-low',
};

export function QuestionCard({ q, visible, selected = false, suggested = false }: QuestionCardProps) {
  const isAnswered = q.status === 'Answered';
  const statusBorder = isAnswered ? 'border-status-success' : 'border-border-default';

  if (suggested) {
    return (
      <MiniCard visible={visible} variant="suggested">
        <MiniCardHeader shortId={q.shortId} />
        <MiniCardTitle weight="regular" muted>{q.text}</MiniCardTitle>
        <MiniActionButtons primaryLabel="Use" secondaryLabel="Hide" />
      </MiniCard>
    );
  }

  return (
    <MiniCard
      visible={visible}
      emphasis={selected}
      connectors={selected ? ['left', 'right'] : []}
    >
      <MiniCardHeader shortId={q.shortId}>
        <MiniCategoryLabel>{q.category}</MiniCategoryLabel>
      </MiniCardHeader>

      <MiniCardTitle weight="regular">{q.text}</MiniCardTitle>

      <MiniStatusChip
        icon={LoaderPinwheel}
        iconColor={isAnswered ? 'text-status-success' : 'text-text-quaternary'}
        borderClass={statusBorder}
      >
        <MiniStatusLabel
          active={isAnswered}
          activeClass="text-status-success"
          inactiveClass="text-text-tertiary"
        >
          {q.status}
        </MiniStatusLabel>
      </MiniStatusChip>

      <MiniCardMeta text={`${q.author} - ${q.createdAt}`}>
        <MiniIndicatorDot color={IMPORTANCE_COLORS[q.importance] ?? 'bg-indicator-low'} title={q.importance} />
      </MiniCardMeta>
    </MiniCard>
  );
}
