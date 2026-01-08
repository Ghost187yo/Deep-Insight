
import React from 'react';
import { ChatSession } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onNewChat: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  onNewChat,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar - Left side */}
      <div className={`fixed left-0 top-0 h-full w-full max-w-sm glass-card border-r border-white/10 z-[70] shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <i className="fas fa-history text-indigo-400 mr-3"></i>
                History
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Past Consultations</p>
            </div>
            <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="p-4 border-b border-white/5">
            <button 
              onClick={() => { onNewChat(); onClose(); }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
            >
              <i className="fas fa-plus mr-2"></i>
              New Insight Chat
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center px-4">
                <i className="fas fa-ghost text-3xl mb-3 opacity-20"></i>
                <p className="text-xs">No saved history yet. Your deep insights will appear here.</p>
              </div>
            ) : (
              sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).map((session) => (
                <div 
                  key={session.id}
                  className={`group relative flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                    session.id === currentSessionId 
                      ? 'bg-indigo-600/20 border-indigo-500/50' 
                      : 'bg-slate-900/40 border-white/5 hover:border-indigo-500/30 hover:bg-slate-900/60'
                  }`}
                  onClick={() => { onSelectSession(session.id); onClose(); }}
                >
                  <div className="flex-grow min-w-0 pr-8">
                    <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                      {session.title || "Untitled Conversation"}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(session.lastUpdated).toLocaleDateString()} at {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          {sessions.length > 0 && (
            <div className="p-6 border-t border-white/5 bg-slate-950/50">
              <button 
                onClick={onClearAll}
                className="w-full border border-red-500/30 hover:bg-red-500/10 text-red-400/80 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center transition-all text-xs"
              >
                <i className="fas fa-dumpster-fire mr-2"></i>
                Wipe All History
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
