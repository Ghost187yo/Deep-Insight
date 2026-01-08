
import React, { useState } from 'react';
import { Source } from '../types';

interface SourceLinksProps {
  sources: Source[];
}

export const SourceLinks: React.FC<SourceLinksProps> = ({ sources }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (sources.length === 0) return null;

  const handleCopy = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIdx(index);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyAll = async () => {
    try {
      const allUrls = sources.map(s => `${s.title}: ${s.url}`).join('\n');
      await navigator.clipboard.writeText(allUrls);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all: ', err);
    }
  };

  return (
    <div className="mt-5 pt-4 border-t border-slate-700/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-1 w-1 bg-indigo-500 rounded-full"></div>
          <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
            Verified Sources
          </h4>
        </div>
        
        {sources.length > 1 && (
          <button 
            onClick={handleCopyAll}
            className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all duration-500 flex items-center space-x-2 border shadow-sm ${
              copiedAll 
                ? 'bg-emerald-500 text-white border-emerald-400 scale-105 shadow-emerald-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-indigo-500/10 active:scale-95'
            }`}
          >
            <i className={`fas ${copiedAll ? 'fa-check-circle' : 'fa-copy'} transition-transform duration-300`}></i>
            <span>{copiedAll ? 'Copied List!' : 'Copy All Sources'}</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {sources.map((source, idx) => (
          <div 
            key={idx} 
            className="flex items-center bg-slate-800/40 border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:bg-slate-800/80 group shadow-sm hover:shadow-indigo-500/5"
          >
            {/* Source Link */}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2.5 px-3.5 py-2 text-[10px] md:text-xs text-indigo-300/90 hover:text-white transition-colors"
              title={`Open ${source.title}`}
            >
              <i className="fas fa-external-link-alt text-[9px] opacity-50 group-hover:opacity-100 transition-opacity"></i>
              <span className="max-w-[120px] sm:max-w-[180px] truncate font-bold tracking-tight">
                {source.title}
              </span>
            </a>

            {/* Individual Copy Action */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleCopy(source.url, idx);
              }}
              className={`flex items-center justify-center px-3 py-2 border-l border-white/5 transition-all group/copy ${
                copiedIdx === idx ? 'bg-emerald-500/20' : 'hover:bg-indigo-500/10 active:bg-indigo-500/20'
              }`}
              title="Copy link"
            >
              <i className={`fas ${
                copiedIdx === idx 
                  ? 'fa-check text-emerald-400 scale-110' 
                  : 'fa-link text-slate-500 group-hover/copy:text-indigo-400'
              } text-[10px] transition-all duration-300`}></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
