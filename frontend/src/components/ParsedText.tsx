import type { SourceItem } from '../types';
import type { TextSegment } from '../utils/citationParser';
import InlineCitation from './InlineCitation';

interface ParsedTextProps {
  segments: TextSegment[];
  academicSources: SourceItem[];
  socialSources: SourceItem[];
}

export default function ParsedText({ segments, academicSources, socialSources }: ParsedTextProps) {
  const getSource = (citationNumber: number, isAcademic: boolean): SourceItem | undefined => {
    const sources = isAcademic ? academicSources : socialSources;
    const index = citationNumber - 1;
    return sources[index];
  };

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'newline') {
          return <br key={index} />;
        }

        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>;
        }

        if (segment.type === 'citation' && segment.citation) {
          const { citationNumber, isAcademic } = segment.citation;
          const source = getSource(citationNumber, isAcademic);
          if (source) {
            return (
              <InlineCitation
                key={index}
                citationNumber={citationNumber}
                source={source}
                isAcademic={isAcademic}
                content={segment.content}
              />
            );
          }
          return (
            <span key={index} className="text-xs text-slate-400 align-super">
              {segment.content}
            </span>
          );
        }

        return null;
      })}
    </>
  );
}
