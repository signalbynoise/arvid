import { FileText } from 'lucide-react';
import { MiniDmcModal } from '../mini-demo/MiniDmcModal';

interface NewRequirementModalProps {
  visible: boolean;
}

function ModalFooter() {
  return (
    <>
      <div className="flex items-center h-10 px-3 rounded-comfortable text-caption font-[var(--fw-medium)] text-text-tertiary">
        Cancel
      </div>
      <div className="flex items-center gap-2 h-10 px-3 rounded-comfortable bg-text-primary text-caption font-[var(--fw-medium)] text-text-on-primary">
        <img src="/favicon.svg" alt="" className="w-4 h-4 invert" />
        Check with Arvid
      </div>
    </>
  );
}

export function NewRequirementModal({ visible }: NewRequirementModalProps) {
  return (
    <MiniDmcModal visible={visible} title="New Requirement" cursorTarget="dmc-new-req-modal" footer={<ModalFooter />}>
      <div className="space-y-2">
        <span className="text-label text-text-quaternary">FREE TEXT</span>
        <div className="min-h-[100px] p-3 rounded-comfortable border border-border-default bg-surface-elevated">
          <span className="text-caption-lg font-[var(--fw-medium)] text-text-tertiary">A lot of text goes here</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-label text-text-quaternary">EXTERNAL SOURCES</span>
        <div className="flex items-center gap-2 h-10 px-3 rounded-comfortable border border-border-default bg-surface-frost-03">
          <FileText size={16} className="text-text-tertiary" />
          <span className="text-caption font-[var(--fw-medium)] text-text-tertiary">Process from documents</span>
        </div>
        <div className="flex items-center gap-2 h-10 px-3 rounded-comfortable border border-border-default bg-surface-frost-03">
          <img src="/gmail.svg" alt="" className="w-4 h-4" />
          <span className="text-caption font-[var(--fw-medium)] text-text-tertiary">Process from Gmail</span>
        </div>
        <div data-cursor-target="dmc-slack-source" className="flex items-center gap-2 h-10 px-3 rounded-comfortable border border-border-default bg-surface-frost-03">
          <img src="/slack.svg" alt="" className="w-4 h-4" />
          <span className="text-caption font-[var(--fw-medium)] text-text-tertiary">Process from Slack</span>
        </div>
      </div>
    </MiniDmcModal>
  );
}
