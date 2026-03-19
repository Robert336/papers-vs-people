import type { AspectEntry } from '../types';
import MatrixRow from './MatrixRow';

interface ComparisonMatrixProps {
  aspects: AspectEntry[] | undefined;
  queryId: number;
  onDive: (aspectName: string) => void;
  onCollapse: (aspectName: string) => void;
  loadingAspect: string | null;
}

export default function ComparisonMatrix({
  aspects,
  queryId,
  onDive,
  onCollapse,
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
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <div className="bg-slate-900 border-b border-slate-700 grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <div className="col-span-2">Aspect</div>
        <div className="col-span-4">What Research Says</div>
        <div className="col-span-4">What People Report</div>
        <div className="col-span-2 text-center">Alignment</div>
      </div>
      {aspects.map((aspect) => (
        <MatrixRow
          key={aspect.name}
          aspect={aspect}
          queryId={queryId}
          onDive={onDive}
          onCollapse={onCollapse}
          loadingAspect={loadingAspect}
        />
      ))}
    </div>
  );
}
