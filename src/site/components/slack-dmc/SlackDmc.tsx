import { useRef, useMemo } from 'react';
import { LoaderPinwheel } from 'lucide-react';
import { MiniCursor } from '../mini-demo/MiniCursor';
import { MiniDmcModal } from '../mini-demo/MiniDmcModal';
import { useDmcEngine } from '../mini-demo/useDmcEngine';
import { slackDirection } from './direction';
import type { SlackState, SlackPool } from './direction';
import { NewRequirementModal } from './NewRequirementModal';
import { SlackChannelsModal } from './SlackChannelsModal';

const BOUNDARY_ID = 'slack-dmc';

const NEW_REQ_STEPS = new Set<SlackState['step']>(['idle', 'focus-slack']);
const CHANNELS_STEPS = new Set<SlackState['step']>(['channels', 'focus-process']);
const LOADING_STEPS = new Set<SlackState['step']>(['loading', 'hold']);

function resolveTarget(verb: string, subject: string): string {
  if (verb === 'focus' && subject === 'slack-source') return 'dmc-slack-source';
  if (verb === 'focus' && subject === 'process-btn') return 'dmc-process-btn';
  if (verb === 'open') return 'dmc-channels-modal';
  if (verb === 'close') return 'dmc-new-req-modal';
  return 'dmc-loading-modal';
}

export function SlackDmc() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { state, currentTransition, activeActor } = useDmcEngine<SlackState, SlackPool>(
    slackDirection,
    containerRef,
  );

  const pool = slackDirection.contentPool;
  const scenario = useMemo(
    () => pool.scenarios[state.scenarioIndex % pool.scenarios.length],
    [state.scenarioIndex, pool.scenarios],
  );

  const showNewReq = NEW_REQ_STEPS.has(state.step);
  const showChannels = CHANNELS_STEPS.has(state.step);
  const showLoading = LOADING_STEPS.has(state.step);

  const cursorTarget = currentTransition
    ? resolveTarget(currentTransition.verb, currentTransition.subject)
    : null;

  return (
    <div
      ref={containerRef}
      data-cursor-boundary={BOUNDARY_ID}
      className="relative aspect-square"
    >
      <div className={`absolute inset-0 flex items-center justify-center p-[10%] transition-all duration-500 ${showNewReq ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full max-w-[85%]">
          <NewRequirementModal visible={showNewReq} />
        </div>
      </div>

      <div className={`absolute inset-0 flex items-center justify-center p-[10%] transition-all duration-500 ${showChannels ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full max-w-[85%]">
          <SlackChannelsModal visible={showChannels} channels={scenario.channels} />
        </div>
      </div>

      <div className={`absolute inset-0 flex items-center justify-center p-[10%] transition-all duration-500 ${showLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full max-w-[85%]">
          <MiniDmcModal
            visible={showLoading}
            title="Slack Integration"
            titleIcon={<img src="/slack.svg" alt="" className="w-3.5 h-3.5" />}
            cursorTarget="dmc-loading-modal"
          >
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <LoaderPinwheel size={24} className="text-text-tertiary animate-spin" />
              <p className="text-caption-lg text-text-tertiary text-center">
                {scenario.loadingMessage}
              </p>
            </div>
          </MiniDmcModal>
        </div>
      </div>

      {slackDirection.actors.map((actor) => (
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
