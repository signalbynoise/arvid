import { MiniDmcModal } from '../mini-demo/MiniDmcModal';

interface SlackChannelsModalProps {
  visible: boolean;
  channels: string[];
}

function ModalFooter() {
  return (
    <>
      <div className="flex items-center h-10 px-3 rounded-comfortable text-caption font-[var(--fw-medium)] text-text-tertiary">
        Back
      </div>
      <div data-cursor-target="dmc-process-btn" className="flex items-center gap-2 h-10 px-3 rounded-comfortable bg-text-primary text-caption font-[var(--fw-medium)] text-text-on-primary">
        <img src="/favicon.svg" alt="" className="w-4 h-4 invert" />
        Process Slack Channel
      </div>
    </>
  );
}

export function SlackChannelsModal({ visible, channels }: SlackChannelsModalProps) {
  return (
    <MiniDmcModal
      visible={visible}
      title="Slack Integration"
      titleIcon={<img src="/slack.svg" alt="" className="w-3.5 h-3.5" />}
      cursorTarget="dmc-channels-modal"
      footer={<ModalFooter />}
    >
      <div className="space-y-2">
        <span className="text-label text-text-quaternary">CHANNELS</span>
        <div className="flex flex-col gap-4 p-3 rounded-comfortable border border-border-default bg-surface-elevated">
          {channels.map((channel) => (
            <span key={channel} className="text-caption font-[var(--fw-medium)] text-text-primary">{channel}</span>
          ))}
        </div>
      </div>
    </MiniDmcModal>
  );
}
