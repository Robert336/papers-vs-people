export interface SourceItem {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  published_date?: string;
}

export interface AspectAcademia {
  summary: string;
  key_findings: string[];
  sources: SourceItem[];
}

export interface AspectReality {
  summary: string;
  key_findings: string[];
  sources: SourceItem[];
}

export interface AspectEntry {
  name: string;
  academia: AspectAcademia;
  reality: AspectReality;
  alignment: number;
  alignment_note: string;
  deepDive?: DeepDiveResponse | null;
}

export interface ComparisonMatrix {
  aspects: AspectEntry[];
}

export type SearchMode = 'pharma' | 'natural';

export const SOCIAL_PLATFORM_DOMAINS: Record<string, string[]> = {
  reddit: ['reddit.com'],
  x: ['x.com', 'twitter.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com'],
  'drugs.com': ['drugs.com'],
  webmd: ['webmd.com'],
  quora: ['quora.com'],
};

export interface SearchResponse {
  id: number;
  medication_name: string;
  summary: string;
  overall_alignment: number;
  comparison_matrix: ComparisonMatrix;
  academic_sources: SourceItem[];
  social_sources: SourceItem[];
  social_platforms: string[] | null;
  created_at: string;
  cost: number;
  model_used?: string;
  mode?: SearchMode;
  deep_dives?: DeepDiveResponse[];
}

export interface HistoryItem {
  id: number;
  medication_name: string;
  overall_alignment: number;
  created_at: string;
  model_used?: string;
  mode?: SearchMode;
}

export interface DeepDiveRequest {
  query_id: number;
  aspect_name: string;
}

export interface DeepDiveResponse {
  id: number;
  query_id: number;
  aspect_name: string;
  detailed_analysis: {
    summary: string;
    key_points: string[];
    gaps: string[];
    sources: SourceItem[];
  };
  academic_sources: SourceItem[];
  social_sources: SourceItem[];
  created_at: string;
  cost: number;
}

export interface CompareSearchRequest {
  query: string;
  social_platforms?: string[];
  model_a: string;
  model_b: string;
  mode?: SearchMode;
}

export interface CompareSearchResponse {
  result_a: SearchResponse;
  result_b: SearchResponse;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
}
