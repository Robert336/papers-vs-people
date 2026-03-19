import type { DeepDiveResponse } from '../types';
import SourceCard from './SourceCard';

interface DeepDivePanelProps {
  deepDive: DeepDiveResponse;
  onCollapse: () => void;
}

export default function DeepDivePanel({ deepDive, onCollapse }: DeepDivePanelProps) {
  const analysis = deepDive.detailed_analysis;

  return (
    <div className="border-l-2 border-primary-500 pl-4 mt-3 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-primary-400 font-semibold text-sm">Deep Dive Analysis</h4>
        <button
          onClick={onCollapse}
          className="text-slate-400 hover:text-slate-200 text-xs transition-colors"
        >
          Collapse
        </button>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>

      {analysis.key_points && analysis.key_points.length > 0 && (
        <div>
          <h5 className="text-slate-200 font-medium text-sm mb-2">Key Findings</h5>
          <ul className="space-y-1.5">
            {analysis.key_points.map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-primary-400 mt-0.5 flex-shrink-0">▸</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.gaps && analysis.gaps.length > 0 && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
          <h5 className="text-red-400 font-medium text-sm mb-2">Gaps in Research</h5>
          <ul className="space-y-1.5">
            {analysis.gaps.map((gap: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-red-400 mt-0.5 flex-shrink-0">!</span>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SourceCard sources={deepDive.academic_sources} type="academic" />
        <SourceCard sources={deepDive.social_sources} type="social" />
      </div>
    </div>
  );
}
