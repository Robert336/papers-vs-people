import { useEffect, useState } from 'react';
import type { SourceItem } from '../types';

interface TooltipCoords {
  top: number;
  left: number;
  position: 'top' | 'bottom';
}

interface CitationTooltipProps {
  source: SourceItem;
  citationNumber: number;
  isAcademic: boolean;
  coords: TooltipCoords;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function CitationTooltip({ source, citationNumber, isAcademic, coords, onMouseEnter, onMouseLeave }: CitationTooltipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.slice(0, maxLength) + '...';
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    top: coords.top,
    left: coords.left,
    transform: 'translateX(-50%)',
    width: '288px',
    maxWidth: '90vw',
  };

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%) rotate(180deg)',
    top: coords.position === 'bottom' ? '-8px' : 'auto',
    bottom: coords.position === 'top' ? '-8px' : 'auto',
  };

  return (
    <div 
      className="bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] overflow-hidden pointer-events-auto"
      style={tooltipStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="absolute left-1/2 -translate-x-1/2" style={arrowStyle}>
        <div className="border-8 border-transparent border-t-white"></div>
      </div>
      
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            isAcademic 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            [{citationNumber}]
          </span>
          <span className={`text-xs font-medium ${isAcademic ? 'text-green-600' : 'text-blue-600'}`}>
            {isAcademic ? 'Academic' : 'Social'}
          </span>
        </div>
        
        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {source.title || 'Untitled'}
        </h4>
        
        <p className="text-xs text-slate-500 truncate">
          {truncateUrl(source.url)}
        </p>
        
        {source.snippet && (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
            {source.snippet}
          </p>
        )}
        
        <div className="pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Click to open source
          </span>
        </div>
      </div>
    </div>
  );
}
