
import React from 'react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-indigo-400 text-sm animate-pulse py-2">
      <i className="fas fa-brain"></i>
      <span>Deep Insight is thinking and searching...</span>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
