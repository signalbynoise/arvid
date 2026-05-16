import React from 'react';

interface CardHeaderScoresProps {
  clarityScore: number | null | undefined;
  riskScore: number | null | undefined;
  completeness: number;
}

export function CardHeaderScores({ clarityScore, riskScore, completeness }: CardHeaderScoresProps) {
  const clamped = Math.max(0, Math.min(100, completeness));

  return (
    <>
      <span className="text-label font-mono text-text-quaternary">
        {clamped}%
      </span>
      {clarityScore != null && (
        <span className="text-label font-mono text-text-quaternary" title={`Clarity: ${clarityScore}/10`}>
          C{clarityScore}
        </span>
      )}
      {riskScore != null && (
        <span className="text-label font-mono text-text-quaternary" title={`Risk: ${riskScore}/10`}>
          R{riskScore}
        </span>
      )}
    </>
  );
}
