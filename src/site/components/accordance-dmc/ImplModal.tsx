import { ACCORDANCE_WEIGHTS } from '../../../../shared/schemas/implCheck';
import { MiniDmcModal } from '../mini-demo/MiniDmcModal';

interface ImplModalProps {
  visible: boolean;
  confidence: number;
  accordanceScore: number;
  dimensions: {
    objective: boolean;
    architecture: boolean;
    constraints: boolean;
    risks: boolean;
  };
  showConfidence: boolean;
  showAccordance: boolean;
  showDimensions: boolean;
}

const DIMENSION_ROWS = [
  { key: 'objective' as const, label: 'Core Objectives', weight: ACCORDANCE_WEIGHTS.objective },
  { key: 'architecture' as const, label: 'Architecture', weight: ACCORDANCE_WEIGHTS.architecture },
  { key: 'constraints' as const, label: 'Constraints', weight: ACCORDANCE_WEIGHTS.constraints },
  { key: 'risks' as const, label: 'Risk Mitigation', weight: ACCORDANCE_WEIGHTS.risks },
] as const;

function barColor(value: number): string {
  if (value >= 80) return 'bg-status-success';
  if (value >= 50) return 'bg-status-warning';
  return 'bg-status-error';
}

function ModalFooter() {
  return (
    <>
      <div className="flex items-center h-10 px-3 rounded-comfortable bg-surface-elevated text-caption font-[var(--fw-medium)] text-text-tertiary">
        Cancel
      </div>
      <div className="flex items-center gap-2 h-10 px-3 rounded-comfortable bg-text-primary text-caption font-[var(--fw-medium)] text-text-on-primary">
        <img src="/favicon.svg" alt="" className="w-4 h-4 invert" />
        Share Analysis
      </div>
    </>
  );
}

export function ImplModal({ visible, confidence, accordanceScore, dimensions, showConfidence, showAccordance, showDimensions }: ImplModalProps) {
  return (
    <MiniDmcModal visible={visible} title="Implementation" cursorTarget="dmc-impl-modal" footer={<ModalFooter />}>
      <div className={`space-y-2.5 transition-opacity duration-500 ${showConfidence ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-caption-lg text-text-primary block">Confidence</span>
        <div className="h-2 bg-surface-frost-10 rounded-pill overflow-hidden">
          <div
            className={`h-full rounded-pill transition-all duration-700 ease-out ${barColor(confidence)}`}
            style={{ width: showConfidence ? `${confidence}%` : '0%' }}
          />
        </div>
      </div>

      <div className={`space-y-2.5 transition-opacity duration-500 ${showAccordance ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-caption-lg text-text-primary block">Accordance</span>
        <div className="h-2 bg-surface-frost-10 rounded-pill overflow-hidden">
          <div
            className={`h-full rounded-pill transition-all duration-700 ease-out ${barColor(accordanceScore)}`}
            style={{ width: showAccordance ? `${accordanceScore}%` : '0%' }}
          />
        </div>
      </div>

      <div className={`space-y-4 transition-opacity duration-500 ${showDimensions ? 'opacity-100' : 'opacity-0'}`}>
        {DIMENSION_ROWS.map(({ key, label, weight }) => {
          const met = dimensions[key];
          return (
            <div key={key} className="flex items-center justify-between">
              <span className={`text-caption-lg font-[var(--fw-semibold)] ${met ? 'text-text-primary' : 'text-text-quaternary'}`}>
                {label}
              </span>
              <span className="text-caption-lg font-[var(--fw-semibold)] text-text-tertiary">
                {met ? weight : 0}.00%
              </span>
            </div>
          );
        })}
      </div>
    </MiniDmcModal>
  );
}
