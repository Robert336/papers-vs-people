interface AlignmentScoreProps {
  score: number | null;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 0.85) return 'Strong Alignment';
  if (score >= 0.7) return 'Moderate Alignment';
  if (score >= 0.5) return 'Partial Alignment';
  return 'Significant Divergence';
}

export default function AlignmentScore({ score, label }: AlignmentScoreProps) {
  if (score === null || score === undefined) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-3 w-48 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-slate-400 rounded-full" />
        </div>
        <span className="text-slate-500 text-sm">No data</span>
      </div>
    );
  }

  const pct = Math.round(score * 100);
  const colorClass = getScoreColor(score);
  const displayLabel = label ?? getScoreLabel(score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Overall Alignment</span>
        <span className={`text-2xl font-bold ${colorClass}`}>{pct}%</span>
      </div>
      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colorClass.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-sm font-medium ${colorClass}`}>{displayLabel}</p>
    </div>
  );
}

export { getScoreColor, getScoreLabel };
