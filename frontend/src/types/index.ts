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

export interface SearchResponse {
  id: number;
  medication_name: string;
  summary: string;
  overall_alignment: number;
  comparison_matrix: ComparisonMatrix;
  academic_sources: SourceItem[];
  social_sources: SourceItem[];
  created_at: string;
}

export interface HistoryItem {
  id: number;
  medication_name: string;
  overall_alignment: number;
  created_at: string;
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
}
