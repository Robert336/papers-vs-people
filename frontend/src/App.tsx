import { useState, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import ResultsView from './components/ResultsView';
import Loading from './components/Loading';
import QueryHistory from './components/QueryHistory';
import { useSearch } from './hooks/useSearch';
import { useHistory } from './hooks/useHistory';
import type { SearchResponse } from './types';

export default function App() {
  const [showHistory, setShowHistory] = useState(false);
  const { result, loading, error, search, clear } = useSearch();
  const { history, loading: historyLoading, fetchHistory, deleteItem, loadItem } =
    useHistory();
  const [historyResult, setHistoryResult] = useState<SearchResponse | null>(null);

  const displayResult = result ?? historyResult;

  const handleLoadFromHistory = useCallback(
    async (id: number) => {
      const data = await loadItem(id);
      setHistoryResult(data);
      setShowHistory(false);
      clear();
      return data;
    },
    [loadItem, clear],
  );

  const handleNewSearch = useCallback(() => {
    setHistoryResult(null);
    clear();
  }, [clear]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-lg leading-none">Academia vs Reality</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Compare research to lived experience</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {displayResult && !loading && (
              <button
                onClick={handleNewSearch}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                New Search
              </button>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">
            Close the gap between research and reality
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Enter a medication name to see what clinical studies say versus what real people actually experience.
            All explained in plain language.
          </p>
        </div>

        <div className="mb-12">
          <SearchBar onSearch={search} loading={loading} />
        </div>

        {error && (
          <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-300 text-sm">
            <p className="font-medium">Search failed</p>
            <p className="mt-1">{error}</p>
            {error.includes('API_KEY') && (
              <p className="mt-2 text-xs text-slate-400">
                Make sure your <code className="bg-slate-800 px-1 rounded">OPENROUTER_API_KEY</code> and{' '}
                <code className="bg-slate-800 px-1 rounded">EXA_API_KEY</code> are set in{' '}
                <code className="bg-slate-800 px-1 rounded">backend/.env</code>
              </p>
            )}
          </div>
        )}

        {loading && <Loading />}

        {!loading && displayResult && <ResultsView result={displayResult} />}

        {!loading && !displayResult && !error && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">Enter a medication above to begin</p>
            <p className="text-sm mt-1">Results are saved to your history automatically</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-16 py-6 text-center text-xs text-slate-600">
        <p>For informational purposes only. Not medical advice. Always consult a healthcare professional.</p>
      </footer>

      {showHistory && (
        <QueryHistory
          history={history}
          loading={historyLoading}
          onFetch={fetchHistory}
          onLoad={handleLoadFromHistory}
          onDelete={deleteItem}
          onClose={() => setShowHistory(false)}
          currentId={displayResult?.id}
        />
      )}
    </div>
  );
}
