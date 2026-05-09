import { Check } from 'lucide-react';

interface MiniConfirmationProps {
  visible: boolean;
  icon: string;
  message: string;
}

export function MiniConfirmation({ visible, icon, message }: MiniConfirmationProps) {
  return (
    <div className={`flex items-center gap-2 p-2 bg-surface-frost-05 border border-border-default rounded-standard transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-status-success shrink-0">
        <Check size={8} className="text-text-on-primary" />
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <img src={icon} alt="" className="w-3 h-3 opacity-60 shrink-0" />
        <span className="text-[7px] font-[var(--fw-medium)] text-text-primary truncate">{message}</span>
      </div>
    </div>
  );
}
