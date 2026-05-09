import { Loader2 } from 'lucide-react';

interface MiniLoadingStateProps {
  message: string;
}

export function MiniLoadingState({ message }: MiniLoadingStateProps) {
  return (
    <div className="flex flex-col items-center py-4 space-y-2">
      <Loader2 size={12} className="text-text-tertiary animate-spin" />
      <p className="text-[7px] text-text-tertiary">{message}</p>
    </div>
  );
}
