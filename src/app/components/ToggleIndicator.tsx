import { ToggleRight, ToggleLeft } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';

interface ToggleIndicatorProps {
  connected: boolean;
}

export function ToggleIndicator({ connected }: ToggleIndicatorProps) {
  return connected
    ? <ToggleRight size={ICON_SIZE.md} className="text-status-success" />
    : <ToggleLeft size={ICON_SIZE.md} className="text-text-quaternary" />;
}
