
import React, { useState, useMemo } from 'react';
import { Message } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';
import { SourceLinks } from './SourceLinks';

interface MessageBubbleProps {
  message: Message;
  isHighlighted?: boolean;
  onSuggestion?: (text: string) => void;
}

const TRUNCATE_THRESHOLD = 800;

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isHighlighted, onSuggestion }) => {
  const isAssistant = message.role === 'assistant';
  const contentLen = message.content.length;
  const [shareFeedback, setShareFeedback] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Define thresholds for different styling modes
  const isLong = contentLen > 450;
  const isShort = contentLen < 80;
  const isCollapsible = isAssistant && contentLen > TRUNCATE_THRESHOLD;

  // Dynamic container width based on length and role
  const maxWidthClass = isAssistant 
    ? (isLong ? 'max-w-[96%] sm:max-w-[90%] lg:max-w-[85%]' : 'max-w-[92%] sm:max-w-[85%] md:max-w-[75%]')
    : 'max-w-[92%] sm:max-w-[80%] md:max-w-[70%]';

  // Dynamic padding and typography based on length
  const bubblePadding = isLong 
    ? 'px-4 py-4 md:px-8 md:py-6' 
    : isShort 
      ? 'px-3 py-2 md:px-4 md:py-2.5' 
      : 'px-4 py-3 md:px-6 md:py-5';

  const proseSize = isLong 
    ? 'text-sm md:text-[1.05rem] leading-relaxed' 
    : 'text-xs sm:text-sm md:text-[0.95rem] leading-relaxed';

  const displayedContent = useMemo(() => {
    if (isCollapsible && !isExpanded) {
      return message.content.slice(0, TRUNCATE_THRESHOLD) + '...';
    }
    return message.content;
  }, [message.content, isCollapsible, isExpanded]);

  const handleShare = async () => {
    const shareData = {
      id: message.id,
      role: message.role,
      content: message.content,
      title: message.title,
      description: message.description,
      sources: message.sources,
      timestamp: message.timestamp.getTime()
    };
    
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
      const shareUrl = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const imageSuggestions = [
    { text: "Analyze this image", icon: "fa-magnifying-glass" },
    { text: "What can you tell me about this image?", icon: "fa-sparkles" },
    { text: "Extract and summarize the text from this image", icon: "fa-file-lines" }
  ];

  return (
    <div 
      id={`msg-${message.id}`}
      className={`flex w-full mb-6 md:mb-10 transition-all duration-700 ${isAssistant ? 'justify-start' : 'justify-end'} ${isHighlighted ? 'scale-[1.02] z-10' : ''}`}
    >
      <div className={`flex ${maxWidthClass} ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-xl self-end mb-1 ${
          isAssistant ? 'bg-indigo-600 mr-2 md:mr-4' : 'bg-slate-700 ml-2 md:ml-4'
        }`}>
          {isAssistant ? (
            <i className="fas fa-sparkles text-white text-xs md:text-base"></i>
          ) : (
            <i className="fas fa-user text-white text-xs md:text-base"></i>
          )}
        </div>
        
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} w-full`}>
          <div className={`${bubblePadding} rounded-2xl md:rounded-[2rem] shadow-sm glass-card border transition-all duration-300 relative ${
            isAssistant 
              ? `rounded-tl-none ${isLong ? 'border-indigo-500/30 bg-slate-900/50' : 'border-indigo-500/20'}` 
              : 'rounded-tr-none border-slate-600/30 bg-slate-800/80'
          } ${isHighlighted ? 'ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] border-indigo-500' : ''}`}>
            
            {/* Share Button for Assistant */}
            {isAssistant && (
              <button 
                onClick={handleShare}
                className={`absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-xl bg-slate-800/60 hover:bg-indigo-600 text-[11px] transition-all duration-300 border border-white/10 ${shareFeedback ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Share this insight"
              >
                <i className={`fas ${shareFeedback ? 'fa-check' : 'fa-share-nodes'}`}></i>
              </button>
            )}

            {/* Title and Description */}
            {(message.title || message.description) && (
              <div className="mb-4 pb-4 border-b border-white/10 pr-10">
                {message.title && (
                  <h3 className="text-lg md:text-xl font-extrabold text-white leading-tight mb-1 tracking-tight">
                    {message.title}
                  </h3>
                )}
                {message.description && (
                  <p className="text-xs md:text-sm text-slate-400 font-medium italic opacity-80">
                    {message.description}
                  </p>
                )}
              </div>
            )}

            {/* Image attachment */}
            {message.image && (
              <div className="mb-5">
                <div className="rounded-2xl overflow-hidden border border-white/10 max-w-full sm:max-w-md shadow-2xl bg-black/20">
                  <img src={message.image} alt="User upload" className="w-full h-auto object-cover max-h-[300px] md:max-h-[500px] hover:scale-105 transition-transform duration-500" />
                </div>
                
                {/* Suggestions specifically for the image in the chat interface */}
                {!isAssistant && onSuggestion && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {imageSuggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => onSuggestion(suggestion.text)}
                        className="text-[10px] md:text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-full hover:bg-indigo-500/25 hover:border-indigo-500/40 hover:text-white transition-all flex items-center space-x-1.5"
                      >
                        <i className={`fas ${suggestion.icon} text-[9px] opacity-70`}></i>
                        <span>{suggestion.text === "Analyze this image" ? "Analyze" : suggestion.text === "What can you tell me about this image?" ? "Tell me more" : "Extract text"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Content text */}
            <div className={`prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap break-words overflow-hidden selection:bg-indigo-500/30 ${proseSize}`}>
              {displayedContent}
            </div>

            {/* Read More / Less Toggle */}
            {isCollapsible && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-4 flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest transition-colors py-1 group"
              >
                <span>{isExpanded ? 'Show less' : 'Read full insight'}</span>
                <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} group-hover:translate-y-0.5 transition-transform`}></i>
              </button>
            )}
            
            {/* Thinking state indicator */}
            {message.isThinking && <ThinkingIndicator />}
            
            {/* Grounding sources */}
            {message.sources && message.sources.length > 0 && (
              <SourceLinks sources={message.sources} />
            )}
          </div>
          
          {/* Timestamp and Metadata */}
          <div className={`flex items-center space-x-3 mt-3 px-2 text-slate-500 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
            <span className="text-[10px] font-semibold tracking-wide opacity-60">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isHighlighted && (
              <span className="text-[9px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <i className="fas fa-star mr-1"></i> Highlight
              </span>
            )}
            {isLong && isAssistant && !isCollapsible && (
              <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400/60 bg-indigo-500/5 px-2 py-0.5 rounded-full border border-indigo-500/10">
                Detailed Insight
              </span>
            )}
            {isCollapsible && (
              <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400/60 bg-indigo-500/5 px-2 py-0.5 rounded-full border border-indigo-500/10">
                Comprehensive Report
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
