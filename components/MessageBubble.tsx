
import React from 'react';
import { Message } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';
import { SourceLinks } from './SourceLinks';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const contentLen = message.content.length;
  
  // Define thresholds for different styling modes
  const isLong = contentLen > 450;
  const isShort = contentLen < 80;

  // Dynamic container width based on length and role
  const maxWidthClass = isAssistant 
    ? (isLong ? 'max-w-[96%] sm:max-w-[90%] lg:max-w-[85%]' : 'max-w-[92%] sm:max-w-[85%] md:max-w-[75%]')
    : 'max-w-[92%] sm:max-w-[80%] md:max-w-[70%]';

  // Dynamic padding and typography based on length
  const bubblePadding = isLong 
    ? 'px-4 py-4 md:px-7 md:py-5' 
    : isShort 
      ? 'px-3 py-2 md:px-4 md:py-2.5' 
      : 'px-3.5 py-3 md:px-5 md:py-4';

  const proseSize = isLong 
    ? 'prose-sm md:prose-base leading-relaxed' 
    : 'prose-xs sm:prose-sm leading-normal';

  return (
    <div className={`flex w-full mb-6 md:mb-8 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex ${maxWidthClass} ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg self-end mb-1 ${
          isAssistant ? 'bg-indigo-600 mr-2 md:mr-3' : 'bg-slate-700 ml-2 md:ml-3'
        }`}>
          {isAssistant ? (
            <i className="fas fa-sparkles text-white text-xs md:text-base"></i>
          ) : (
            <i className="fas fa-user text-white text-xs md:text-base"></i>
          )}
        </div>
        
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} w-full`}>
          <div className={`${bubblePadding} rounded-xl md:rounded-2xl shadow-sm glass-card border transition-all duration-300 ${
            isAssistant 
              ? `rounded-tl-none ${isLong ? 'border-indigo-500/30 bg-slate-900/40' : 'border-indigo-500/20'}` 
              : 'rounded-tr-none border-slate-600/30 bg-slate-800/80'
          }`}>
            {/* Title and Description */}
            {(message.title || message.description) && (
              <div className="mb-3 pb-3 border-b border-white/5">
                {message.title && (
                  <h3 className="text-base md:text-lg font-bold text-white leading-tight mb-1">
                    {message.title}
                  </h3>
                )}
                {message.description && (
                  <p className="text-xs md:text-sm text-slate-400 italic">
                    {message.description}
                  </p>
                )}
              </div>
            )}

            {/* Image attachment */}
            {message.image && (
              <div className="mb-4 rounded-lg overflow-hidden border border-white/10 max-w-full sm:max-w-md shadow-inner">
                <img src={message.image} alt="User upload" className="w-full h-auto object-cover max-h-[300px] md:max-h-[500px]" />
              </div>
            )}
            
            {/* Content text */}
            <div className={`prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap break-words overflow-hidden ${proseSize}`}>
              {message.content}
            </div>
            
            {/* Thinking state indicator */}
            {message.isThinking && <ThinkingIndicator />}
            
            {/* Grounding sources */}
            {message.sources && message.sources.length > 0 && (
              <SourceLinks sources={message.sources} />
            )}
          </div>
          
          {/* Timestamp and Metadata */}
          <div className={`flex items-center space-x-2 mt-2 px-1 text-slate-500 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
            <span className="text-[9px] md:text-[10px] font-medium tracking-tight">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isLong && isAssistant && (
              <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-bold text-indigo-400/60 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                Detailed Insight
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
