import type { FlatSource } from '../utils/citationParser';

interface ReferenceListProps {
  sources: FlatSource[];
}

const domainIcons: Record<string, string> = {
  'pubmed.gov': '🔬',
  'ncbi.nlm.nih.gov': '🧬',
  'clinicaltrials.gov': '📋',
  'fda.gov': '💊',
  'reddit.com': '💬',
  'x.com': '𝕏',
  'twitter.com': '𝕏',
  'drugs.com': '💊',
  'webmd.com': '🏥',
  'youtube.com': '▶️',
  'patient.info': '👤',
};

function getIcon(domain: string): string {
  return (
    domainIcons[domain] ??
    (domain.includes('gov') ? '🏛️' : '🔗')
  );
}

export default function ReferenceList({ sources }: ReferenceListProps) {
  if (!sources || sources.length === 0) return null;

  const academicSources = sources.filter(s => s.sourceType === 'academic');
  const socialSources = sources.filter(s => s.sourceType === 'social');

  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <span>📚</span> References
      </h3>

      {academicSources.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
            <span>📘</span> Academic Sources
          </h4>
          <ol className="space-y-2 list-none">
            {academicSources.map(({ citationNumber, source }) => (
              <li key={source.url} className="flex items-start gap-3 group">
                <span className="flex-shrink-0 inline-flex items-center justify-center border border-green-600 text-green-600 rounded-full text-xs font-semibold w-6 h-6 mt-0.5">
                  {citationNumber}
                </span>
                <span className="flex-shrink-0 mt-0.5">{getIcon(source.domain)}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-green-600 transition-colors leading-relaxed group-hover:text-green-600"
                >
                  {source.title || source.url}
                </a>
                <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                  ({source.domain})
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {socialSources.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <span>📲</span> Social / Patient Sources
          </h4>
          <ol className="space-y-2 list-none">
            {socialSources.map(({ citationNumber, source }) => (
              <li key={source.url} className="flex items-start gap-3 group">
                <span className="flex-shrink-0 inline-flex items-center justify-center border border-blue-600 text-blue-600 rounded-full text-xs font-semibold w-6 h-6 mt-0.5">
                  {citationNumber}
                </span>
                <span className="flex-shrink-0 mt-0.5">{getIcon(source.domain)}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors leading-relaxed group-hover:text-blue-600"
                >
                  {source.title || source.url}
                </a>
                <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                  ({source.domain})
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
