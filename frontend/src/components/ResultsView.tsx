import { useState } from 'react';
import type { SearchResponse, AspectEntry } from '../types';
import MedicationSummary from './MedicationSummary';
import AlignmentScore from './AlignmentScore';
import ComparisonMatrix from './ComparisonMatrix';
import SourceCard from './SourceCard';
import { useDeepDive } from '../hooks/useDeepDive';

interface ResultsViewProps {
  result: SearchResponse;
}

export default function ResultsView({ result }: ResultsViewProps) {
  const [matrix, setMatrix] = useState<AspectEntry[] | undefined>(
    result.comparison_matrix?.aspects ?? [],
  );
  const { loadingAspect, dive, collapse } = useDeepDive(matrix, setMatrix);

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      <MedicationSummary name={result.medication_name} summary={result.summary} />

      <AlignmentScore score={result.overall_alignment} />

      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Comparison Matrix
        </h3>
        <ComparisonMatrix
          aspects={matrix}
          queryId={result.id}
          onDive={(aspectName) => dive(result.id, aspectName)}
          onCollapse={collapse}
          loadingAspect={loadingAspect}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SourceCard sources={result.academic_sources} type="academic" />
        <SourceCard sources={result.social_sources} type="social" />
      </div>
    </div>
  );
}
