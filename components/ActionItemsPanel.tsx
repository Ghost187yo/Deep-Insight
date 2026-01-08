
import React from 'react';
import { ActionItem } from '../types';

interface ActionItemsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  items: ActionItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ActionItemsPanel: React.FC<ActionItemsPanelProps> = ({ isOpen, onClose, summary, items, isLoading, onRefresh }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm glass-card border-l border-white/10 z-[70] shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <i className="fas fa-clipboard-check text-indigo-400 mr-3"></i>
                Action Recap
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Smart Intelligence</p>
            </div>
            <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-4 text-slate-400">
                <i className="fas fa-circle-notch fa-spin text-2xl text-indigo-500"></i>
                <p className="text-sm font-medium animate-pulse">Synthesizing conversation...</p>
              </div>
            ) : (
              <>
                {/* Executive Summary Section */}
                {(summary || items.length > 0) && (
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <i className="fas fa-quote-right text-4xl text-indigo-400"></i>
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 flex items-center">
                      <i className="fas fa-file-alt mr-2"></i>
                      Executive Summary
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      {summary || "No conversation history to summarize yet."}
                    </p>
                  </div>
                )}

                {/* Tasks Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-1">
                    Actionable Tasks ({items.length})
                  </h3>
                  
                  {items.length === 0 ? (
                    <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-2xl">
                      <i className="fas fa-tasks text-slate-700 text-xl mb-3 block"></i>
                      <p className="text-xs text-slate-500">No specific tasks detected yet.</p>
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all group hover:bg-slate-900/60">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            item.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            item.priority === 'medium' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 font-semibold leading-relaxed group-hover:text-white transition-colors">{item.task}</p>
                        {item.context && (
                          <p className="text-[11px] text-slate-500 mt-2 italic leading-snug">"{item.context}"</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="p-6 border-t border-white/5 bg-slate-950/50">
            <button 
              onClick={onRefresh}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? (
                <i className="fas fa-circle-notch fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-sync-alt mr-2"></i>
              )}
              Refresh Recap
            </button>
            <p className="text-center text-[10px] text-slate-600 mt-4 px-2 uppercase tracking-tight">
              AI-generated summary • verify critical tasks
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
