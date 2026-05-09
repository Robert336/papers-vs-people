import { useState, useMemo, useEffect } from 'react';
import type { SearchResponse, AspectEntry } from '../types';
import type { CompareTab } from '../hooks/useSearch';
import MedicationSummary from './MedicationSummary';
import AlignmentScore from './AlignmentScore';
import ComparisonMatrix from './ComparisonMatrix';
import ReferenceList from './ReferenceList';
import { useDeepDive } from '../hooks/useDeepDive';
import { getFilteredFlatSourceList, filterSourcesByPlatforms, deduplicateSources } from '../utils/citationParser';

interface ResultsViewProps {
  result: SearchResponse;
  isCompareMode?: boolean;
  resultA?: SearchResponse | null;
  resultB?: SearchResponse | null;
  activeTab?: CompareTab;
  onTabChange?: (tab: CompareTab) => void;
}

export default function ResultsView({
  result,
  isCompareMode,
  resultA,
  resultB,
  activeTab,
  onTabChange,
}: ResultsViewProps) {
  const initialAspects = useMemo(() => {
    const aspects = result.comparison_matrix?.aspects ?? [];
    if (!result.deep_dives || result.deep_dives.length === 0) return aspects;
    const diveMap = new Map(result.deep_dives.map((d) => [d.aspect_name, d]));
    return aspects.map((a) =>
      diveMap.has(a.name) ? { ...a, deepDive: diveMap.get(a.name) } : a,
    );
  }, [result]);

  const [matrix, setMatrix] = useState<AspectEntry[] | undefined>(initialAspects);

  useEffect(() => {
    setMatrix(initialAspects);
  }, [initialAspects]);

  const { loadingAspect, dive, toggleRow, expandedRows } = useDeepDive(setMatrix);

  const selectedPlatforms = result.social_platforms;
  const filteredAcademicSources = result.academic_sources || [];
  const filteredSocialSources = filterSourcesByPlatforms(
    result.social_sources || [],
    selectedPlatforms,
  );
  const { academicSources: summaryAcademic, socialSources: summarySocial } = deduplicateSources(
    filteredAcademicSources,
    filteredSocialSources,
  );
  const allSources = getFilteredFlatSourceList(result);

  const handleDive = async (aspectName: string) => {
    await dive(result.id, aspectName);
  };

  const modelLabelA = resultA?.model_used;
  const modelLabelB = resultB?.model_used;

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      {/* Compare Tabs */}
      {isCompareMode && resultA && resultB && onTabChange && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onTabChange('a')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border transition-colors ${
              activeTab === 'a'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {modelLabelA || 'Model A'}
          </button>
          <button
            onClick={() => onTabChange('b')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border transition-colors ${
              activeTab === 'b'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {modelLabelB || 'Model B'}
          </button>
        </div>
      )}

      {/* Model Badge */}
      {result.model_used && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002-2z"
              />
            </svg>
            {result.model_used}
          </span>
        </div>
      )}

      {/* Search Mode Badge */}
      {result.mode && result.mode !== 'pharma' && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
            Natural Medicine Search
          </span>
        </div>
      )}

      <MedicationSummary
        name={result.medication_name}
        summary={result.summary}
        academicSources={summaryAcademic}
        socialSources={summarySocial}
      />

      <AlignmentScore score={result.overall_alignment} />

      <div>
        {result.social_platforms && result.social_platforms.length > 0 && (
          <div className="mb-4">
            <span className="text-sm font-medium text-slate-600 mr-2">Social Networks Searched:</span>
            {result.social_platforms.map((platform) => (
              <span
                key={platform}
                className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded mr-1"
              >
                {platform}
              </span>
            ))}
          </div>
        )}
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Comparison Matrix</h3>
        <ComparisonMatrix
          aspects={matrix}
          queryId={result.id}
          onDive={handleDive}
          onToggle={toggleRow}
          expandedRows={expandedRows}
          loadingAspect={loadingAspect}
        />
      </div>

      <ReferenceList sources={allSources} />
    </div>
  );
}
