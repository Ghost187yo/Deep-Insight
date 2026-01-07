
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, IntelligenceMode, ActionItem } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ActionItemsPanel } from './components/ActionItemsPanel';
import { geminiService } from './services/geminiService';
import { APP_CONFIG } from './constants';

const LOCAL_STORAGE_KEY = 'deep_insight_history_v1';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<IntelligenceMode>('reasoning');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Action Items State
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isRecapping, setIsRecapping] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        title: 'Welcome to Deep Insight',
        description: 'Your advanced multi-modal intelligence partner.',
        content: `Hello! I've been upgraded with multi-modal vision, structured messaging, and Smart Recap. You can ask me to analyze complex data, upload images for visual reasoning, and track actionable tasks via the "Recap" feature.`,
        timestamp: new Date(),
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const [showCamera, setShowCamera] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      setSelectedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const clearChat = () => {
    if (window.confirm("Clear conversation?")) {
      const welcome: Message = {
        id: 'welcome',
        role: 'assistant',
        title: 'Session Restarted',
        description: 'History has been cleared.',
        content: `Conversation reset. Vision systems and structured reasoning modules are online. How can I help you?`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
      setActionItems([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const getRecap = async () => {
    if (messages.length < 2) return;
    setIsActionPanelOpen(true);
    setIsRecapping(true);
    try {
      const history = messages.filter(m => m.id !== 'welcome').map(m => {
        const parts: any[] = [{ text: m.content }];
        if (m.image) {
          parts.unshift({
            inlineData: { mimeType: "image/jpeg", data: m.image.split(',')[1] }
          });
        }
        return { role: m.role === 'assistant' ? 'model' as const : 'user' as const, parts };
      });
      const items = await geminiService.getActionItems(history);
      setActionItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecapping(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isStreaming) return;

    const currentImage = selectedImage;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (currentImage ? "Analyze this image" : ""),
      timestamp: new Date(),
      image: currentImage || undefined
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: mode === 'reasoning',
      sources: []
    };

    setMessages(prev => [...prev, userMessage, initialAssistantMessage]);
    setInput('');
    setSelectedImage(null);
    setIsStreaming(true);

    try {
      const currentHistory = messages.filter(m => m.id !== 'welcome').map(m => {
        const parts: any[] = [{ text: m.content }];
        if (m.image) {
          parts.unshift({
            inlineData: { mimeType: "image/jpeg", data: m.image.split(',')[1] }
          });
        }
        return { role: m.role === 'assistant' ? 'model' as const : 'user' as const, parts };
      });

      const stream = geminiService.streamQuery(userMessage.content, currentHistory, mode, currentImage || undefined);
      
      for await (const chunk of stream) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, content: chunk.text, sources: chunk.sources, isThinking: !chunk.done && mode === 'reasoning' } 
            : m
        ));
      }
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: "Error communicating with AI.", isThinking: false } 
          : m
      ));
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div 
      className={`flex flex-col h-screen overflow-hidden bg-slate-950 font-sans text-slate-200 transition-all duration-300 ${isDragging ? 'scale-[0.99] grayscale-[0.5]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ActionItemsPanel 
        isOpen={isActionPanelOpen} 
        onClose={() => setIsActionPanelOpen(false)} 
        items={actionItems} 
        isLoading={isRecapping}
        onRefresh={getRecap}
      />

      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-indigo-500 m-4 rounded-3xl pointer-events-none">
          <div className="text-center">
            <i className="fas fa-cloud-upload-alt text-6xl text-indigo-400 mb-4 animate-bounce"></i>
            <h2 className="text-2xl font-bold text-white">Drop to analyze image</h2>
          </div>
        </div>
      )}

      <header className="flex-shrink-0 h-16 glass-card border-b border-white/5 px-4 md:px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-indigo-600/20">
            <i className="fas fa-sparkles text-white text-sm md:text-base"></i>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              {APP_CONFIG.NAME}
            </h1>
            <p className="hidden xs:block text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
              {APP_CONFIG.SLOGAN}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={getRecap}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-xs font-semibold text-slate-300"
          >
            <i className="fas fa-list-check text-indigo-400"></i>
            <span className="hidden sm:inline">Recap</span>
          </button>

          <div className="flex items-center space-x-1 bg-slate-900/50 p-1 rounded-full border border-slate-800">
            <button 
              onClick={() => setMode('reasoning')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${mode === 'reasoning' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <i className="fas fa-brain mr-1.5"></i>REASONING
            </button>
            <button 
              onClick={() => setMode('instant')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${mode === 'instant' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <i className="fas fa-bolt mr-1.5"></i>INSTANT
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto chat-gradient scroll-smooth relative">
        {showCamera && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
            <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl" />
            <div className="mt-6 flex space-x-4">
              <button onClick={capturePhoto} className="bg-white text-black h-14 w-14 rounded-full flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-transform">
                <i className="fas fa-camera"></i>
              </button>
              <button onClick={stopCamera} className="bg-slate-800 text-white h-14 w-14 rounded-full flex items-center justify-center text-xl hover:scale-105 transition-transform">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto py-6 px-4 md:py-8 md:px-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      <footer className="flex-shrink-0 p-3 md:p-6 bg-slate-950/80 backdrop-blur-md border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-3 flex items-center bg-slate-900/80 p-2 rounded-xl border border-indigo-500/30 inline-flex group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative">
                <img src={selectedImage} alt="Preview" className="h-14 w-14 rounded-lg object-cover mr-2 border border-white/10" />
                <div className="absolute inset-0 bg-indigo-500/20 rounded-lg animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Image Attached</span>
                <span className="text-[10px] text-slate-500">Ready for analysis</span>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="ml-3 h-7 w-7 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500/20 transition-all flex items-center justify-center"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          )}

          <div className="relative glass-card rounded-xl md:rounded-2xl border border-white/10 shadow-2xl focus-within:border-indigo-500/50 transition-all duration-300">
            <div className="flex items-end px-2 pb-2 pt-1">
              <div className="flex pb-1.5 space-x-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-xl transition-all"
                  title="Upload Image"
                >
                  <i className="fas fa-image text-lg"></i>
                </button>
                <button 
                  onClick={startCamera}
                  className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-xl transition-all"
                  title="Take Photo"
                >
                  <i className="fas fa-camera text-lg"></i>
                </button>
                <button 
                  onClick={toggleListening}
                  className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-300 ${isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50'}`}
                  title={isListening ? "Stop Listening" : "Voice Input"}
                >
                  <i className={`fas ${isListening ? 'fa-microphone-alt' : 'fa-microphone'} text-lg`}></i>
                </button>
              </div>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isListening ? "Listening..." : (selectedImage ? "Ask something about this image..." : "Analyze, edit, or search...")}
                className={`flex-grow bg-transparent p-2.5 md:p-3 focus:outline-none min-h-[48px] max-h-[200px] text-sm md:text-base text-slate-200 placeholder:text-slate-500 overflow-y-auto transition-colors duration-300 ${isListening ? 'placeholder:text-indigo-400/50' : ''}`}
                rows={1}
                disabled={isStreaming}
              />

              <button 
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && !selectedImage) || isStreaming}
                className={`h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl mb-1 mr-0.5 transition-all duration-300 ${
                  (input.trim() || selectedImage) && !isStreaming 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isStreaming ? (
                  <i className="fas fa-circle-notch fa-spin text-sm"></i>
                ) : (
                  <i className="fas fa-paper-plane text-sm"></i>
                )}
              </button>
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <div className="flex justify-center flex-wrap gap-2 mt-3">
             <button onClick={getRecap} className="text-[10px] bg-indigo-600/10 hover:bg-indigo-600/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 transition-colors font-bold">
               <i className="fas fa-bolt mr-1.5"></i> Smart Recap
             </button>
             <button onClick={() => setInput("Summarize our findings so far")} className="text-[10px] bg-slate-900/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 transition-colors">
               <i className="fas fa-list-ul mr-1.5"></i> Summarize
             </button>
             <button onClick={clearChat} className="text-[10px] bg-slate-900/50 hover:bg-red-950/30 px-3 py-1.5 rounded-lg border border-slate-800 text-red-400/70 transition-colors">
               <i className="fas fa-trash-alt mr-1.5"></i> Clear Session
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
