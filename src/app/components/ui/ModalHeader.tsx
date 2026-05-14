import { X } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 shrink-0">
      <h2 className="text-caption-lg text-text-primary">{title}</h2>
      <button
        onClick={onClose}
        aria-label="Close"
        className="text-text-quaternary hover:text-text-primary transition-colors p-1 rounded-standard hover:bg-surface-frost-05"
      >
        <X size={ICON_SIZE.md} />
      </button>
    </div>
  );
}
