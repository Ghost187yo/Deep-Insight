
import React from 'react';
import { Source } from '../types';

interface SourceLinksProps {
  sources: Source[];
}

export const SourceLinks: React.FC<SourceLinksProps> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-700/50">
      <h4 className="text-[9px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sources</h4>
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 md:space-x-2 px-2.5 py-1 md:px-3 md:py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg md:rounded-full text-[10px] md:text-xs text-indigo-300 transition-all duration-200 active:scale-95"
          >
            <i className="fas fa-link text-[8px] md:text-[10px]"></i>
            <span className="max-w-[120px] sm:max-w-[150px] truncate font-medium">{source.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
