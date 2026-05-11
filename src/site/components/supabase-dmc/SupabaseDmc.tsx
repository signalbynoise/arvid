import { useRef, useMemo } from 'react';
import { LoaderPinwheel } from 'lucide-react';
import { MiniCursor } from '../mini-demo/MiniCursor';
import { MiniDmcModal } from '../mini-demo/MiniDmcModal';
import { useDmcEngine } from '../mini-demo/useDmcEngine';
import { supabaseDirection } from './direction';
import type { SupabaseState, SupabasePool } from './direction';
import { IntegrationFooter } from './IntegrationFooter';
import { DatabaseMenu } from './DatabaseMenu';

const BOUNDARY_ID = 'supabase-dmc';

const FOOTER_STEPS = new Set<SupabaseState['step']>(['idle', 'focus', 'dropdown', 'select']);
const MODAL_STEPS = new Set<SupabaseState['step']>(['loading', 'hold']);

function resolveTarget(verb: string, subject: string): string {
  if (verb === 'focus') return 'dmc-db-trigger';
  if (verb === 'open') return 'dmc-db-trigger';
  if (verb === 'select') return 'dmc-db-menu';
  if (verb === 'close') return 'dmc-db-trigger';
  return 'dmc-loading-modal';
}

export function SupabaseDmc() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { state, currentTransition, activeActor } = useDmcEngine<SupabaseState, SupabasePool>(
    supabaseDirection,
    containerRef,
  );

  const pool = supabaseDirection.contentPool;
  const scenario = useMemo(
    () => pool.scenarios[state.scenarioIndex % pool.scenarios.length],
    [state.scenarioIndex, pool.scenarios],
  );

  const showFooter = FOOTER_STEPS.has(state.step);
  const showDropdown = state.step === 'dropdown' || state.step === 'select';
  const showModal = MODAL_STEPS.has(state.step);

  const cursorTarget = currentTransition
    ? resolveTarget(currentTransition.verb, currentTransition.subject)
    : null;

  return (
    <div
      ref={containerRef}
      data-cursor-boundary={BOUNDARY_ID}
      className="relative aspect-square"
    >
      <div className={`absolute inset-0 flex items-center justify-center p-[10%] transition-all duration-500 ${showFooter ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full max-w-[75%]">
          <IntegrationFooter
            databaseValue={scenario.databaseName}
            visible={showFooter}
            databaseOverlay={showDropdown ? (
              <DatabaseMenu
                databaseName={scenario.databaseName}
                visible={showDropdown}
              />
            ) : undefined}
          />
        </div>
      </div>

      <div className={`absolute inset-0 flex items-center justify-center p-[10%] transition-all duration-500 ${showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full max-w-[85%]">
          <MiniDmcModal
            visible={showModal}
            title="Supabase Integration"
            titleIcon={<img src="/supabase.svg" alt="" className="w-3.5 h-3.5" />}
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

      {supabaseDirection.actors.map((actor) => (
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
