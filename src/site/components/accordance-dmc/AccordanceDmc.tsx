import { useRef, useMemo } from 'react';
import { ACCORDANCE_WEIGHTS } from '../../../../shared/schemas/implCheck';
import { MiniCursor } from '../mini-demo/MiniCursor';
import { useDmcEngine } from '../mini-demo/useDmcEngine';
import { accordanceDirection } from './direction';
import type { AccordanceState, AccordancePool, Scenario } from './direction';
import { DmcRequirementCard } from './DmcRequirementCard';
import { ImplModal } from './ImplModal';

const BOUNDARY_ID = 'accordance-dmc';
const IMPL_CHIP_TARGET = 'dmc-impl-chip';

const CARD_STEPS = new Set<AccordanceState['step']>(['idle', 'focus']);
const MODAL_STEPS = new Set<AccordanceState['step']>(['open', 'confidence', 'accordance', 'dimensions', 'hold']);

function computeAccordance(dims: Scenario['dimensions']): number {
  return (
    (dims.objective ? ACCORDANCE_WEIGHTS.objective : 0) +
    (dims.architecture ? ACCORDANCE_WEIGHTS.architecture : 0) +
    (dims.constraints ? ACCORDANCE_WEIGHTS.constraints : 0) +
    (dims.risks ? ACCORDANCE_WEIGHTS.risks : 0)
  );
}

function resolveTarget(verb: string, subject: string): string {
  if (verb === 'focus') return IMPL_CHIP_TARGET;
  if (verb === 'close') return IMPL_CHIP_TARGET;
  return 'dmc-impl-modal';
}

export function AccordanceDmc() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { state, currentTransition, activeActor } = useDmcEngine<AccordanceState, AccordancePool>(
    accordanceDirection,
    containerRef,
  );

  const pool = accordanceDirection.contentPool;
  const scenario = useMemo(
    () => pool.scenarios[state.scenarioIndex % pool.scenarios.length],
    [state.scenarioIndex, pool.scenarios],
  );

  const accordanceScore = useMemo(() => computeAccordance(scenario.dimensions), [scenario.dimensions]);

  const showCard = CARD_STEPS.has(state.step);
  const showModal = MODAL_STEPS.has(state.step);

  const step = state.step;
  const showConfidence = step === 'confidence' || step === 'accordance' || step === 'dimensions' || step === 'hold';
  const showAccordance = step === 'accordance' || step === 'dimensions' || step === 'hold';
  const showDimensions = step === 'dimensions' || step === 'hold';

  const cursorTarget = currentTransition
    ? resolveTarget(currentTransition.verb, currentTransition.subject)
    : null;

  return (
    <div
      ref={containerRef}
      data-cursor-boundary={BOUNDARY_ID}
      className="relative aspect-square"
    >
      <div className={`absolute inset-0 flex items-center justify-center p-[12%] transition-all duration-500 ${showCard ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full max-w-[75%]">
          <DmcRequirementCard
            shortId={scenario.requirement.shortId}
            title={scenario.requirement.title}
            completeness={scenario.requirement.completeness}
            status="Pre backlog"
            implStatus="Not implemented"
            owner={`${scenario.requirement.owner} - Today 12:00`}
            visible={showCard}
            implChipTarget={IMPL_CHIP_TARGET}
          />
        </div>
      </div>

      <div className={`absolute inset-0 flex items-center justify-center p-[10%] transition-all duration-500 ${showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full max-w-[85%]">
          <ImplModal
            visible={showModal}
            confidence={scenario.confidence}
            accordanceScore={accordanceScore}
            dimensions={scenario.dimensions}
            showConfidence={showConfidence}
            showAccordance={showAccordance}
            showDimensions={showDimensions}
          />
        </div>
      </div>

      {accordanceDirection.actors.map((actor) => (
        <MiniCursor
          key={actor.id}
          name={actor.name}
          target={activeActor === actor.id && cursorTarget ? cursorTarget : ''}
          visible={activeActor === actor.id && !!cursorTarget}
          boundaryId={BOUNDARY_ID}
        />
      ))}
    </div>
  );
}
