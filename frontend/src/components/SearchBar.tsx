import { useState, useEffect, useRef, FormEvent } from 'react';
import { modelsApi } from '../services/api';
import type { OpenRouterModel, SearchMode } from '../types';

const ALL_PLATFORMS = ['reddit', 'x', 'tiktok', 'youtube', 'drugs.com', 'webmd', 'quora'];

interface SearchBarProps {
  onSearch: (query: string, socialPlatforms?: string[], model?: string, searchMode?: SearchMode) => void;
  onCompare: (
    query: string,
    socialPlatforms: string[] | undefined,
    modelA: string,
    modelB: string,
    searchMode?: SearchMode,
  ) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, onCompare, loading }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(new Set(ALL_PLATFORMS));
  const [comparisonMode, setComparisonMode] = useState<'single' | 'compare'>('single');
  const [searchMode, setSearchMode] = useState<SearchMode>('pharma');
  const [selectedModel, setSelectedModel] = useState('');
  const [modelA, setModelA] = useState('');
  const [modelB, setModelB] = useState('');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    modelsApi
      .fetchOpenRouterModels()
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, []);

  const togglePlatform = (platform: string) => {
    const newEnabled = new Set(enabledPlatforms);
    if (newEnabled.has(platform)) {
      newEnabled.delete(platform);
    } else {
      newEnabled.add(platform);
    }
    setEnabledPlatforms(newEnabled);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;

    const platforms = Array.from(enabledPlatforms);

    if (comparisonMode === 'compare') {
      if (!modelA || !modelB) return;
      onCompare(value.trim(), platforms, modelA, modelB, searchMode);
    } else {
      onSearch(value.trim(), platforms, selectedModel || undefined, searchMode);
    }
  };

  const allSelected = enabledPlatforms.size === ALL_PLATFORMS.length;
  const canSubmit =
    value.trim() &&
    !loading &&
    (comparisonMode === 'single' || (comparisonMode === 'compare' && modelA && modelB));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Mode Toggle (Pharma vs Natural) */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => setSearchMode('pharma')}
          className={`px-4 py-1.5 text-sm font-medium rounded-l-lg border transition-colors ${
            searchMode === 'pharma'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          Pharmaceutical
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('natural')}
          className={`px-4 py-1.5 text-sm font-medium rounded-r-lg border transition-colors ${
            searchMode === 'natural'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          Natural Medicine
        </button>
      </div>

      {/* Comparison Mode Toggle (Single vs Compare) */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <button
          type="button"
          onClick={() => setComparisonMode('single')}
          className={`px-4 py-1.5 text-sm font-medium rounded-l-lg border transition-colors ${
            comparisonMode === 'single'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          Single Model
        </button>
        <button
          type="button"
          onClick={() => setComparisonMode('compare')}
          className={`px-4 py-1.5 text-sm font-medium rounded-r-lg border transition-colors ${
            comparisonMode === 'compare'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          Compare Models
        </button>
      </div>

      {/* Model Selectors */}
      <div
        className={`mb-3 ${comparisonMode === 'compare' ? 'grid grid-cols-2 gap-3' : 'flex justify-center'}`}
      >
        {comparisonMode === 'single' ? (
          <ModelSelector
            label="Model"
            models={models}
            loading={modelsLoading}
            value={selectedModel}
            onChange={setSelectedModel}
            placeholder="Default model"
          />
        ) : (
          <>
            <ModelSelector
              label="Model A"
              models={models}
              loading={modelsLoading}
              value={modelA}
              onChange={setModelA}
              placeholder="Select model A"
              required
            />
            <ModelSelector
              label="Model B"
              models={models}
              loading={modelsLoading}
              value={modelB}
              onChange={setModelB}
              placeholder="Select model B"
              required
            />
          </>
        )}
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={searchMode === 'natural' ? 'Enter a natural remedy (e.g., Ashwagandha, Turmeric, CBD)...' : 'Enter a medication name (e.g., Adderall, Ozempic, Lexapro)...'}
              disabled={loading}
              className="w-full pl-12 pr-32 py-4 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-all text-base"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="absolute right-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {loading ? 'Searching...' : comparisonMode === 'compare' ? 'Compare' : 'Search'}
            </button>
          </div>
          {loading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 animate-pulse"
                style={{ width: '60%' }}
              />
            </div>
          )}
        </div>

        {/* Social Platform Toggles */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Social platforms:</span>
          {ALL_PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                enabledPlatforms.has(platform)
                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                  : 'bg-white text-slate-500 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {platform}
              {enabledPlatforms.has(platform) && (
                <span className="ml-1 text-green-600">&#10003;</span>
              )}
            </button>
          ))}
          {!allSelected && enabledPlatforms.size > 0 && (
            <span className="text-xs text-slate-400 ml-2">
              {enabledPlatforms.size} selected
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// --- ModelSelector Sub-component ---

interface ModelSelectorProps {
  label: string;
  models: OpenRouterModel[];
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

function ModelSelector({
  label,
  models,
  loading,
  value,
  onChange,
  placeholder,
  required,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = filter
    ? models.filter(
        (m) =>
          m.id.toLowerCase().includes(filter.toLowerCase()) ||
          m.name.toLowerCase().includes(filter.toLowerCase()),
      )
    : models;

  const selectedName = value
    ? models.find((m) => m.id === value)?.name || value
    : '';

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full text-left px-3 py-2 bg-white border rounded-lg text-sm transition-colors ${
          value ? 'border-green-300 text-slate-700' : 'border-slate-300 text-slate-400'
        } ${open ? 'ring-2 ring-green-500 border-transparent' : 'hover:border-slate-400'}`}
      >
        {value ? selectedName : placeholder}
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 mt-3 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

        {open && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col" style={{ minWidth: '100%', width: 'max-content', maxWidth: '500px' }}>
          <div className="p-2 border-b border-slate-100">
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search models..."
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-400">Loading models...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">No models found</div>
            ) : (
              <>
                {/* Custom model input option */}
                {filter && !models.some((m) => m.id === filter) && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(filter);
                      setOpen(false);
                      setFilter('');
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 border-b border-slate-100 text-green-700 font-medium"
                  >
                    Use custom: {filter}
                  </button>
                )}
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                      setFilter('');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 border-b border-slate-50 ${
                      value === m.id ? 'bg-green-50 text-green-700' : 'text-slate-700'
                    }`}
                  >
                    <div className="font-medium whitespace-nowrap">{m.name}</div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">{m.id}</div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
