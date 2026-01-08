
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  sources?: Source[];
  image?: string; // Base64 image data
  title?: string;
  description?: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface ActionItem {
  task: string;
  priority: 'low' | 'medium' | 'high';
  context?: string;
}

export interface RecapData {
  summary: string;
  tasks: ActionItem[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  lastUpdated: Date;
}

export type IntelligenceMode = 'reasoning' | 'instant';
