import type { AspectEntry, DeepDiveResponse } from '../types';
import { getScoreColor } from './AlignmentScore';
import DeepDivePanel from './DeepDivePanel';

interface MatrixRowProps {
  aspect: AspectEntry;
  queryId: number;
  onDive: (aspectName: string) => void;
  onToggle: (aspectName: string) => void;
  expandedRows: Set<string>;
  loadingAspect: string | null;
}

export default function MatrixRow({
  aspect,
  onDive,
  onToggle,
  expandedRows,
  loadingAspect,
}: MatrixRowProps) {
  const pct = Math.round(aspect.alignment * 100);
  const colorClass = getScoreColor(aspect.alignment);
  const isExpanded = expandedRows.has(aspect.name);
  const hasDeepDive = !!aspect.deepDive;
  const isLoading = loadingAspect === aspect.name;

  const handleButtonClick = () => {
    if (hasDeepDive) {
      onToggle(aspect.name);
    } else if (!isLoading) {
      onDive(aspect.name);
    }
  };

  return (
    <div className="border-b border-slate-700 last:border-0">
      <div className="grid grid-cols-12 gap-2 px-4 py-3 items-start hover:bg-slate-800/50 transition-colors">
        <div className="col-span-2 text-slate-200 font-medium text-sm self-center">
          {aspect.name}
        </div>

        <div className="col-span-4 text-sm text-slate-400 leading-relaxed">
          {aspect.academia.summary}
        </div>

        <div className="col-span-4 text-sm text-slate-400 leading-relaxed">
          {aspect.reality.summary}
        </div>

        <div className="col-span-2 flex flex-col items-center gap-1 self-center">
          <span className={`text-sm font-bold ${colorClass}`}>{pct}%</span>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            onClick={handleButtonClick}
            disabled={isLoading && !hasDeepDive}
            className="text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading...
              </>
            ) : isExpanded ? (
              '▲ Collapse'
            ) : hasDeepDive ? (
              '▼ View Details'
            ) : (
              '▼ Dive Deeper'
            )}
          </button>
        </div>
      </div>

      {isExpanded && hasDeepDive && (
        <div className="px-4 pb-4">
          <DeepDivePanel
            deepDive={aspect.deepDive as DeepDiveResponse}
            onCollapse={() => onToggle(aspect.name)}
          />
        </div>
      )}
    </div>
  );
}
