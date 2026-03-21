import type { DeepDiveResponse } from '../types';
import { parseTextWithCitations, deduplicateSources } from '../utils/citationParser';
import ParsedText from './ParsedText';

interface DeepDivePanelProps {
  deepDive: DeepDiveResponse;
  onCollapse: () => void;
}

function TextWithBreaks({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split('\n');
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export default function DeepDivePanel({ 
  deepDive, 
  onCollapse,
}: DeepDivePanelProps) {
  const analysis = deepDive.detailed_analysis;
  const rawAcademic = (deepDive.academic_sources || []) as import('../types').SourceItem[];
  const rawSocial = (deepDive.social_sources || []) as import('../types').SourceItem[];
  const { academicSources, socialSources } = deduplicateSources(rawAcademic, rawSocial);

  const hasCitations = /\[(\d+|A\d+)\]/.test(
    analysis.summary + analysis.key_points?.join('') + analysis.gaps?.join('')
  );

  const summarySegments = parseTextWithCitations(analysis.summary, academicSources, socialSources);
  const keyPointsSegments = (analysis.key_points || []).map(point => 
    parseTextWithCitations(point, academicSources, socialSources)
  );
  const gapsSegments = (analysis.gaps || []).map(gap => 
    parseTextWithCitations(gap, academicSources, socialSources)
  );

  return (
    <div className="border-l-2 border-green-500 pl-4 mt-3 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-green-700 font-semibold text-sm">Deep Dive Analysis</h4>
        <button
          onClick={onCollapse}
          className="text-slate-400 hover:text-slate-600 text-xs transition-colors"
        >
          Collapse
        </button>
      </div>

      <p className="text-slate-600 text-sm leading-relaxed">
        {hasCitations ? (
          <ParsedText 
            segments={summarySegments}
            academicSources={academicSources}
            socialSources={socialSources}
          />
        ) : (
          <TextWithBreaks text={analysis.summary} />
        )}
      </p>

      {analysis.key_points && analysis.key_points.length > 0 && (
        <div>
          <h5 className="text-slate-700 font-medium text-sm mb-2">Key Findings</h5>
          <ul className="space-y-1.5">
            {keyPointsSegments.map((segments, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-green-600 mt-0.5 flex-shrink-0">&#9656;</span>
                {hasCitations ? (
                  <ParsedText 
                    segments={segments}
                    academicSources={academicSources}
                    socialSources={socialSources}
                  />
                ) : (
                  <TextWithBreaks text={analysis.key_points[i]} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.gaps && analysis.gaps.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h5 className="text-red-600 font-medium text-sm mb-2">Gaps in Research</h5>
          <ul className="space-y-1.5">
            {gapsSegments.map((segments, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-red-500 mt-0.5 flex-shrink-0">!</span>
                {hasCitations ? (
                  <ParsedText 
                    segments={segments}
                    academicSources={academicSources}
                    socialSources={socialSources}
                  />
                ) : (
                  <TextWithBreaks text={analysis.gaps[i]} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
