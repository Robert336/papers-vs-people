import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import ResultsView from './components/ResultsView';
import Loading from './components/Loading';
import QueryHistory from './components/QueryHistory';
import { useSearch } from './hooks/useSearch';
import { useHistory } from './hooks/useHistory';
import { useLastState } from './hooks/useLastState';
import type { SearchResponse } from './types';

const HowThisWorks = lazy(() => import('./components/HowThisWorks'));

function HomePage() {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const {
    result,
    singleResult,
    resultA,
    resultB,
    activeTab,
    setActiveTab,
    isCompareMode,
    loading,
    error,
    search,
    compare,
    clear,
  } = useSearch();
  const { history, loading: historyLoading, fetchHistory, deleteItem, loadItem } =
    useHistory();
  const [historyResult, setHistoryResult] = useState<SearchResponse | null>(null);
  const {
    autoLoadedResult,
    loading: lastStateLoading,
    loadLastState,
    saveLastState,
    clearLastState,
    hasLastState,
  } = useLastState();

  useEffect(() => {
    if (hasLastState && !singleResult && !historyResult && !isCompareMode) {
      loadLastState().then((data) => {
        if (data) {
          setHistoryResult(data);
        }
      });
    }
  }, [hasLastState, loadLastState, singleResult, historyResult, isCompareMode]);

  const displayResult = isCompareMode ? result : (singleResult ?? historyResult ?? autoLoadedResult);

  useEffect(() => {
    if (displayResult && !isCompareMode) {
      saveLastState(displayResult);
    }
  }, [displayResult, saveLastState, isCompareMode]);

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
    clearLastState();
  }, [clear, clearLastState]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">
              P
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-none">Papers vs People</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Compare research to lived experience</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/how-this-works')}
              className="text-sm text-slate-500 hover:text-green-700 transition-colors"
            >
              How This Works
            </button>
            {(displayResult || isCompareMode) && !loading && (
              <button
                onClick={handleNewSearch}
                className="text-sm text-slate-500 hover:text-green-700 transition-colors"
              >
                New Search
              </button>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="text-sm text-slate-500 hover:text-green-700 transition-colors flex items-center gap-1.5"
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
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Close the gap between research and reality
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Enter a medication name to see what clinical studies say versus what real people actually experience.
            All explained in plain language.
          </p>
        </div>

        <div className="mb-12">
          <SearchBar onSearch={search} onCompare={compare} loading={loading} />
        </div>

        {error && (
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <p className="font-medium">Search failed</p>
            <p className="mt-1">{error}</p>
            {error.includes('API_KEY') && (
              <p className="mt-2 text-xs text-slate-500">
                Make sure your <code className="bg-slate-100 px-1 rounded">OPENROUTER_API_KEY</code> and{' '}
                <code className="bg-slate-100 px-1 rounded">EXA_API_KEY</code> are set in{' '}
                <code className="bg-slate-100 px-1 rounded">backend/.env</code>
              </p>
            )}
          </div>
        )}

        {loading && <Loading />}

        {lastStateLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-slate-500">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Resuming your last session...</span>
            </div>
          </div>
        )}

        {!loading && displayResult && (
          <ResultsView
            key={displayResult.id}
            result={displayResult}
            isCompareMode={isCompareMode}
            resultA={resultA}
            resultB={resultB}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {!loading && !displayResult && !error && (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">&#128269;</div>
            <p className="text-lg">Enter a medication above to begin</p>
            <p className="text-sm mt-1">Results are saved to your history automatically</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-500">
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

    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-700">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-this-works" element={<HowThisWorksPage />} />
      </Routes>
    </div>
  );
}

function HowThisWorksPage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">
              P
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-none">Papers vs People</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Compare research to lived experience</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-500 hover:text-green-700 transition-colors"
            >
              ← Back to Search
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-10">
        <Suspense fallback={<Loading />}>
          <HowThisWorks />
        </Suspense>
      </main>
      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-500">
        <p>For informational purposes only. Not medical advice. Always consult a healthcare professional.</p>
      </footer>
    </>
  );
}