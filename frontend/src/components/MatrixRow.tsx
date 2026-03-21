import type { AspectEntry, DeepDiveResponse } from '../types';
import { getScoreColor } from './AlignmentScore';
import DeepDivePanel from './DeepDivePanel';
import { parseTextWithCitations, getAspectSources, deduplicateSources } from '../utils/citationParser';
import ParsedText from './ParsedText';

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

  const { academicSources: rawAcademic, socialSources: rawSocial } = getAspectSources(aspect);
  const { academicSources, socialSources } = deduplicateSources(rawAcademic, rawSocial);

  const hasCitations = /\[(\d+|A\d+)\]/.test(aspect.academia.summary + aspect.reality.summary);

  const academiaSegments = parseTextWithCitations(aspect.academia.summary, academicSources, socialSources);
  const realitySegments = parseTextWithCitations(aspect.reality.summary, academicSources, socialSources);

  const handleButtonClick = () => {
    if (hasDeepDive) {
      onToggle(aspect.name);
    } else if (!isLoading) {
      onDive(aspect.name);
    }
  };

  return (
    <div className="border-b border-slate-200 last:border-0">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 items-start hover:bg-slate-50 transition-colors">
        <div className="md:col-span-2 text-slate-700 font-medium text-sm self-center">
          <span className="md:hidden font-semibold text-xs text-slate-500 uppercase tracking-wider block mb-1">Aspect</span>
          {aspect.name}
        </div>

        <div className="md:col-span-4 text-sm text-slate-600 leading-relaxed">
          <span className="md:hidden font-semibold text-xs text-slate-500 uppercase tracking-wider block mb-1">What Research Says</span>
          {hasCitations ? (
            <ParsedText 
              segments={academiaSegments}
              academicSources={academicSources}
              socialSources={socialSources}
            />
          ) : (
            aspect.academia.summary
          )}
        </div>

        <div className="md:col-span-4 text-sm text-slate-600 leading-relaxed">
          <span className="md:hidden font-semibold text-xs text-slate-500 uppercase tracking-wider block mb-1">What People Report</span>
          {hasCitations ? (
            <ParsedText 
              segments={realitySegments}
              academicSources={academicSources}
              socialSources={socialSources}
            />
          ) : (
            aspect.reality.summary
          )}
        </div>

         <div className="md:col-span-2 flex flex-row md:flex-col md:items-center gap-3 md:gap-1 items-start self-center md:mt-0 mt-2">
           <div className="flex md:flex-col items-center gap-2 md:gap-1">
             <span className={`text-sm font-bold ${colorClass}`}>{pct}%</span>
             <div className="w-16 md:w-full bg-slate-200 rounded-full h-1.5">
               <div
                 className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`}
                 style={{ width: `${pct}%` }}
               />
             </div>
           </div>
            <button
              onClick={handleButtonClick}
              disabled={isLoading && !hasDeepDive}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-green-700 text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4">
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '50%' }} />
                    </div>
                  </div>
                  <span className="ml-1 text-white">Loading...</span>
                </>
              ) : isExpanded ? (
                <>
                  <span className="text-white">▲</span>
                  <span className="text-white">Collapse Details</span>
                </>
              ) : hasDeepDive ? (
                <>
                  <span className="text-white">▼</span>
                  <span className="text-white">View Details</span>
                </>
              ) : (
                <>
                  <span className="text-white">▼</span>
                  <span className="text-white">Dive Deeper</span>
                </>
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
