import { Check, X, LoaderPinwheel, CircleDashed } from 'lucide-react';

interface SuggestedQuestionsProps {
  selectReq: boolean;
  suggestQ1: boolean;
  suggestQ2: boolean;
  suggestQ3: boolean;
  acceptQ1: boolean;
  acceptQ2: boolean;
}

function SuggestionCard({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="p-2.5 rounded-md border border-dashed border-border-strong bg-surface-frost-01 opacity-70 transition-all duration-500">
      <div className="flex items-center mb-1.5">
        <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1 py-0.5 rounded-sm uppercase tracking-wider border border-border-subtle">AI Suggestion</span>
      </div>
      <h4 className="text-[9px] font-[var(--fw-regular)] text-text-tertiary leading-snug mb-2">{text}</h4>
      <div className="flex items-center space-x-1.5">
        <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-08 text-text-primary rounded-sm text-[7px] font-[var(--fw-medium)]">
          <Check size={6} />
          <span>Use</span>
        </div>
        <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-05 text-text-tertiary rounded-sm text-[7px] font-[var(--fw-medium)]">
          <X size={6} />
          <span>Hide</span>
        </div>
      </div>
    </div>
  );
}

function AcceptedCard({ text, category, visible }: { text: string; category: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="p-2.5 rounded-md border border-border-subtle bg-surface-frost-02 transition-all duration-500 opacity-100">
      <h4 className="text-[9px] font-[var(--fw-regular)] text-text-primary leading-snug mb-2">{text}</h4>
      <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
        <LoaderPinwheel size={8} className="opacity-70" />
        <span>Arvid</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-sm border text-[7px] font-[var(--fw-medium)] text-status-error bg-status-error-surface border-status-error-border">
          <CircleDashed size={7} />
          <span>Unanswered</span>
        </div>
        <span className="text-[7px] text-text-quaternary uppercase tracking-wider font-[var(--fw-medium)]">{category}</span>
      </div>
    </div>
  );
}

export function SuggestedQuestions({ selectReq, suggestQ1, suggestQ2, suggestQ3, acceptQ1, acceptQ2 }: SuggestedQuestionsProps) {
  return (
    <div className="w-1/2 shrink-0 flex flex-col bg-surface-panel">
      <div className="p-2 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">2. Questions</span>
        {suggestQ1 && <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" />}
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-hidden">
        {selectReq ? (
          <>
            {suggestQ1 && (
              acceptQ1 ? (
                <AcceptedCard
                  text="How should the system detect a 'successful login' to trigger the refresh—via a session flag, or event?"
                  category="Auth"
                  visible
                />
              ) : (
                <SuggestionCard
                  text="How should the system detect a 'successful login' to trigger the refresh?"
                  visible
                />
              )
            )}

            {suggestQ2 && (
              acceptQ2 ? (
                <AcceptedCard
                  text="What specific profile fields from GitHub or Google should be synced to the Supabase users table?"
                  category="Data"
                  visible
                />
              ) : (
                <SuggestionCard
                  text="What profile fields from GitHub/Google should be synced to Supabase?"
                  visible
                />
              )
            )}

            {suggestQ3 && (
              <SuggestionCard
                text="How does the system determine which provider (GitHub or Google) to query for profile data?"
                visible
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-[8px] text-text-quaternary">Select a requirement</p>
          </div>
        )}
      </div>
    </div>
  );
}
