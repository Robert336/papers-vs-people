import type { SearchResponse, SourceItem } from '../types';
import { SOCIAL_PLATFORM_DOMAINS } from '../types';

export interface CitationMarker {
  index: number;
  citationNumber: number;
  source: SourceItem;
  isAcademic: boolean;
}

export interface TextSegment {
  type: 'text' | 'citation' | 'newline';
  content: string;
  citation?: CitationMarker;
}

const CITATION_REGEX = /\[(\d+)\]|\[A(\d+)\]/g;

export function parseTextWithCitations(
  text: string,
  academicSources: SourceItem[],
  socialSources: SourceItem[]
): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(CITATION_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    const isAcademic = match[1] !== undefined;
    const citationIndex = parseInt(isAcademic ? match[1] : match[2], 10);
    const sources = isAcademic ? academicSources : socialSources;
    const sourceIndex = citationIndex - 1;

    let citationContent = match[0];
    let nextIndex = match.index + match[0].length;

    const nextChar = text.charAt(nextIndex);
    if (nextChar && /[.,;:!?)]/.test(nextChar)) {
      citationContent = match[0] + nextChar;
      nextIndex += 1;
    }

    if (sourceIndex >= 0 && sourceIndex < sources.length) {
      segments.push({
        type: 'citation',
        content: citationContent,
        citation: {
          index: sourceIndex,
          citationNumber: citationIndex,
          source: sources[sourceIndex],
          isAcademic,
        },
      });
    } else {
      segments.push({
        type: 'text',
        content: citationContent,
      });
    }

    lastIndex = nextIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return splitNewlines(segments);
}

function splitNewlines(segments: TextSegment[]): TextSegment[] {
  const result: TextSegment[] = [];
  for (const segment of segments) {
    if (segment.type !== 'text' || !segment.content.includes('\n')) {
      result.push(segment);
      continue;
    }
    const parts = segment.content.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length > 0) {
        result.push({ type: 'text', content: parts[i] });
      }
      if (i < parts.length - 1) {
        result.push({ type: 'newline', content: '' });
      }
    }
  }
  return result;
}

export interface FlatSource {
  citationNumber: number;
  source: SourceItem;
  sourceType: 'academic' | 'social';
}

export function getFlatSourceList(response: SearchResponse): FlatSource[] {
  const sources: FlatSource[] = [];
  const seenUrls = new Set<string>();
  let academicIndex = 0;
  let socialIndex = 0;

  response.academic_sources?.forEach((source) => {
    if (!seenUrls.has(source.url)) {
      seenUrls.add(source.url);
      academicIndex++;
      sources.push({
        citationNumber: academicIndex,
        source,
        sourceType: 'academic',
      });
    }
  });

  response.social_sources?.forEach((source) => {
    if (!seenUrls.has(source.url)) {
      seenUrls.add(source.url);
      socialIndex++;
      sources.push({
        citationNumber: socialIndex,
        source,
        sourceType: 'social',
      });
    }
  });

  return sources;
}

export function getAspectSources(aspect: { academia: { sources: SourceItem[] }; reality: { sources: SourceItem[] } }): {
  academicSources: SourceItem[];
  socialSources: SourceItem[];
} {
  const academicSources = aspect.academia.sources || [];
  const socialSources = aspect.reality.sources || [];
  return { academicSources, socialSources };
}

export function deduplicateSources(
  academicSources: SourceItem[],
  socialSources: SourceItem[]
): { academicSources: SourceItem[]; socialSources: SourceItem[] } {
  const seenUrls = new Set<string>();
  const dedupedAcademic: SourceItem[] = [];
  const dedupedSocial: SourceItem[] = [];

  academicSources.forEach((source) => {
    if (!seenUrls.has(source.url)) {
      seenUrls.add(source.url);
      dedupedAcademic.push(source);
    }
  });

  socialSources.forEach((source) => {
    if (!seenUrls.has(source.url)) {
      seenUrls.add(source.url);
      dedupedSocial.push(source);
    }
  });

  return { academicSources: dedupedAcademic, socialSources: dedupedSocial };
}

export function getDeepDiveSources(detail: { sources: SourceItem[] }): {
  academicSources: SourceItem[];
  socialSources: SourceItem[];
} {
  const seenUrls = new Set<string>();
  const academicSources: SourceItem[] = [];
  const socialSources: SourceItem[] = [];

  (detail.sources || []).forEach((source) => {
    if (seenUrls.has(source.url)) return;
    seenUrls.add(source.url);

    if (source.domain.includes('gov') || 
        source.domain.includes('pubmed') || 
        source.domain.includes('ncbi') ||
        source.domain.includes('fda') ||
        source.domain.includes('clinicaltrials') ||
        source.domain.includes('doi')) {
      academicSources.push(source);
    } else {
      socialSources.push(source);
    }
  });

  return { academicSources, socialSources };
}

export function isDomainAllowed(domain: string, selectedPlatforms: string[] | null): boolean {
  if (!selectedPlatforms || selectedPlatforms.length === 0) {
    return false;
  }
  
  for (const platform of selectedPlatforms) {
    const allowedDomains = SOCIAL_PLATFORM_DOMAINS[platform];
    if (allowedDomains) {
      for (const allowedDomain of allowedDomains) {
        if (domain.includes(allowedDomain)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function filterSourcesByPlatforms(
  sources: SourceItem[],
  selectedPlatforms: string[] | null
): SourceItem[] {
  if (!selectedPlatforms || selectedPlatforms.length === 0) {
    return [];
  }
  return sources.filter(source => isDomainAllowed(source.domain, selectedPlatforms));
}

export function filterDeepDiveSources(
  detail: { sources: SourceItem[] },
  selectedPlatforms: string[] | null
): { academicSources: SourceItem[]; socialSources: SourceItem[] } {
  if (!selectedPlatforms || selectedPlatforms.length === 0) {
    return getDeepDiveSources(detail);
  }
  const filtered = filterSourcesByPlatforms(detail.sources || [], selectedPlatforms);
  return getDeepDiveSources({ sources: filtered });
}

export function getFilteredFlatSourceList(
  response: SearchResponse
): FlatSource[] {
  const selectedPlatforms = response.social_platforms;
  const sources: FlatSource[] = [];
  const seenUrls = new Set<string>();
  let academicIndex = 0;
  let socialIndex = 0;

  response.academic_sources?.forEach((source) => {
    if (!seenUrls.has(source.url)) {
      seenUrls.add(source.url);
      academicIndex++;
      sources.push({
        citationNumber: academicIndex,
        source,
        sourceType: 'academic',
      });
    }
  });

  const filteredSocialSources = filterSourcesByPlatforms(
    response.social_sources || [],
    selectedPlatforms
  );
  filteredSocialSources.forEach((source) => {
    if (!seenUrls.has(source.url)) {
      seenUrls.add(source.url);
      socialIndex++;
      sources.push({
        citationNumber: socialIndex,
        source,
        sourceType: 'social',
      });
    }
  });

  return sources;
}
