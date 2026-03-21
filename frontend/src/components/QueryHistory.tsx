import { useEffect } from 'react';
import type { HistoryItem, SearchResponse } from '../types';
import { getScoreColor } from './AlignmentScore';

interface QueryHistoryProps {
  history: HistoryItem[];
  loading: boolean;
  onFetch: () => void;
  onLoad: (id: number) => Promise<SearchResponse>;
  onDelete: (id: number) => void;
  onClose: () => void;
  currentId?: number;
}

export default function QueryHistory({
  history,
  loading,
  onFetch,
  onLoad,
  onDelete,
  onClose,
  currentId,
}: QueryHistoryProps) {
  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end max-w-[100vw] overflow-x-hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-w-full bg-white border-l border-slate-200 h-full overflow-y-auto overflow-x-hidden p-6 shadow-xl overscroll-behavior-contain">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Search History</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-8">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p>No searches yet.</p>
            <p className="text-sm mt-1">Your search history will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {history.map((item) => {
              const pct = Math.round(item.overall_alignment * 100);
              const colorClass = getScoreColor(item.overall_alignment);
              const isActive = item.id === currentId;
              const date = new Date(item.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <li
                  key={item.id}
                  className={`bg-slate-50 border rounded-lg p-4 group ${isActive ? 'border-green-500' : 'border-slate-200 hover:border-slate-300'} transition-colors`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => onLoad(item.id)}
                      className="flex-1 text-left"
                    >
                      <p className={`font-semibold ${isActive ? 'text-green-700' : 'text-slate-800'}`}>
                        {item.medication_name}
                        {item.mode === 'natural' && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 rounded">
                            Natural
                          </span>
                        )}
                        {item.model_used && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded">
                            {item.model_used}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{date}</p>
                      <p className={`text-sm mt-1 ${colorClass}`}>{pct}% alignment</p>
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
