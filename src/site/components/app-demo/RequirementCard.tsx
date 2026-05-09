import { MiniCard, MiniCardHeader, MiniCardTitle, MiniCardMeta, MiniIndicatorDot, MiniCompletenessRing } from '../mini-demo';
import type { Requirement } from './types';

interface RequirementCardProps {
  req: Requirement;
  selected: boolean;
  visible: boolean;
  dimmed: boolean;
}

const CLARITY_COLORS: Record<string, string> = {
  High: 'bg-indicator-high',
  Medium: 'bg-indicator-medium',
  Low: 'bg-indicator-low',
};

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-indicator-high',
  Medium: 'bg-indicator-medium',
  High: 'bg-indicator-low',
};

export function RequirementCard({ req, selected, visible, dimmed }: RequirementCardProps) {
  return (
    <MiniCard
      visible={visible}
      emphasis={selected}
      dimmed={dimmed}
      connectors={selected ? ['right'] : []}
    >
      <MiniCardHeader shortId={req.shortId} />
      <MiniCardTitle>{req.title}</MiniCardTitle>
      <MiniCompletenessRing value={req.completeness} />
      <MiniCardMeta text={`${req.owner} - ${req.createdAt}`}>
        <MiniIndicatorDot color={CLARITY_COLORS[req.clarity]} title={`Clarity: ${req.clarity}`} />
        <MiniIndicatorDot color={RISK_COLORS[req.risk]} title={`Risk: ${req.risk}`} />
      </MiniCardMeta>
    </MiniCard>
  );
}
