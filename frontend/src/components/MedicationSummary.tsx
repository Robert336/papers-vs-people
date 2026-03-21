import type { SourceItem } from '../types';
import { parseTextWithCitations } from '../utils/citationParser';
import ParsedText from './ParsedText';

interface MedicationSummaryProps {
  name: string;
  summary: string;
  academicSources?: SourceItem[];
  socialSources?: SourceItem[];
}

export default function MedicationSummary({ 
  name, 
  summary, 
  academicSources = [], 
  socialSources = [] 
}: MedicationSummaryProps) {
  const paragraphs = summary.split('\n').filter((p) => p.trim());
  const hasCitations = /\[(\d+|A\d+)\]/.test(summary);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">{name}</h2>
      <div className="space-y-3">
        {paragraphs.map((para, i) => {
          if (hasCitations) {
            const segments = parseTextWithCitations(para, academicSources, socialSources);
            return (
              <p key={i} className="text-slate-600 leading-relaxed text-base">
                <ParsedText 
                  segments={segments} 
                  academicSources={academicSources}
                  socialSources={socialSources}
                />
              </p>
            );
          }
          return (
            <p key={i} className="text-slate-600 leading-relaxed text-base">
              {para}
            </p>
          );
        })}
      </div>
    </div>
  );
}
