import type { SourceItem } from '../types';

interface SourceCardProps {
  sources: SourceItem[];
  type: 'academic' | 'social';
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

export default function SourceCard({ sources, type }: SourceCardProps) {
  if (!sources || sources.length === 0) return null;

  const label = type === 'academic' ? 'Academic Sources' : 'Social Sources';
  const borderColor = type === 'academic' ? 'border-slate-200' : 'border-slate-200';
  const labelColor = type === 'academic' ? 'text-green-700' : 'text-green-700';
  const icon = type === 'academic' ? '📘' : '📲';

  return (
    <div className={`border ${borderColor} rounded-lg p-4 bg-white`}>
      <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${labelColor}`}>
        <span>{icon}</span> {label}
      </h4>
      <ul className="space-y-2">
        {sources.slice(0, 5).map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0">{getIcon(s.domain)}</span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-green-600 transition-colors line-clamp-2 leading-snug"
            >
              {s.title || s.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
