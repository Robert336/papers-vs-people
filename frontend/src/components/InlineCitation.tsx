import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SourceItem } from '../types';
import CitationTooltip from './CitationTooltip';

interface InlineCitationProps {
  citationNumber: number;
  source: SourceItem;
  isAcademic: boolean;
  content?: string;
}

const TOOLTIP_WIDTH = 288;
const TOOLTIP_HEIGHT = 200;
const TOOLTIP_OFFSET = 8;
const TOOLTIP_GAP = 5;

interface TooltipCoords {
  top: number;
  left: number;
  position: 'top' | 'bottom';
}

export default function InlineCitation({ citationNumber, source, isAcademic, content }: InlineCitationProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [tooltipCoords, setTooltipCoords] = useState<TooltipCoords | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculateTooltipPosition = (): TooltipCoords | null => {
    if (!buttonRef.current) return null;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    
    const tooltipFitsAbove = spaceAbove >= TOOLTIP_HEIGHT + TOOLTIP_OFFSET;
    const tooltipFitsBelow = spaceBelow >= TOOLTIP_HEIGHT + TOOLTIP_OFFSET;
    
    let left = rect.left + rect.width / 2;
    const halfTooltip = TOOLTIP_WIDTH / 2;
    
    if (left - halfTooltip < 8) {
      left = halfTooltip + 8;
    } else if (left + halfTooltip > viewportWidth - 8) {
      left = viewportWidth - halfTooltip - 8;
    }
    
    const position = (!tooltipFitsAbove && tooltipFitsBelow) ? 'bottom' : 'top';
    const top = position === 'top' 
      ? rect.top - TOOLTIP_HEIGHT - TOOLTIP_GAP 
      : rect.bottom + TOOLTIP_GAP;
    
    return { top, left, position };
  };

  useEffect(() => {
    if (showTooltip) {
      const coords = calculateTooltipPosition();
      setTooltipCoords(coords);
    } else {
      setTooltipCoords(null);
    }
  }, [showTooltip, isTooltipHovered]);

  const trailingPunctuation = content?.match(/\[[\dA]+\](.)/)?.[1] || '';

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!isTooltipHovered) {
        setShowTooltip(false);
      }
    }, 150);
  };

  const handleTooltipMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsTooltipHovered(true);
  };

  const handleTooltipMouseLeave = () => {
    setIsTooltipHovered(false);
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150);
  };

  const handleClick = () => {
    window.open(source.url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <span 
        className="relative inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          ref={buttonRef}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={`
            inline-flex items-center justify-center
            border rounded-full text-xs font-semibold
            transition-all duration-150 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-offset-1
            hover:scale-105 active:scale-95
            ${isAcademic 
              ? 'border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-400' 
              : 'border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-400'
            }
          `}
          style={{
            minWidth: '20px',
            height: '20px',
            padding: '0 5px',
            verticalAlign: 'super',
            lineHeight: 1,
          }}
          aria-label={`Citation ${citationNumber}: ${source.title || source.url}`}
        >
          {citationNumber}
        </button>
        {trailingPunctuation && <span className="text-xs text-slate-600">{trailingPunctuation}</span>}
      </span>
      
      {showTooltip && tooltipCoords && createPortal(
        <CitationTooltip 
          source={source} 
          citationNumber={citationNumber}
          isAcademic={isAcademic}
          coords={tooltipCoords}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        />,
        document.body
      )}
    </>
  );
}
