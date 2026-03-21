import type { AspectEntry } from '../types';
import MatrixRow from './MatrixRow';

interface ComparisonMatrixProps {
  aspects: AspectEntry[] | undefined;
  queryId: number;
  onDive: (aspectName: string) => void;
  onToggle: (aspectName: string) => void;
  expandedRows: Set<string>;
  loadingAspect: string | null;
}

export default function ComparisonMatrix({
  aspects,
  queryId,
  onDive,
  onToggle,
  expandedRows,
  loadingAspect,
}: ComparisonMatrixProps) {
  if (!aspects || aspects.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        No comparison data available.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
        <div className="col-span-2">Aspect</div>
        <div className="col-span-4">What Research Says</div>
        <div className="col-span-4">What People Report</div>
        <div className="col-span-2 text-center">Alignment</div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px] md:min-w-0">
          {aspects.map((aspect) => (
            <MatrixRow
              key={aspect.name}
              aspect={aspect}
              queryId={queryId}
              onDive={onDive}
              onToggle={onToggle}
              expandedRows={expandedRows}
              loadingAspect={loadingAspect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
