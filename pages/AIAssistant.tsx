import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, X, FileText, Box, Code, Activity, ArrowRight, ExternalLink } from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { ChatMessage, TraceType } from '../types';

// --- Mock Knowledge Base (Synced with Traceability.tsx conceptually) ---
interface KnowledgeItem {
  id: string;
  label: string;
  type: TraceType;
  status: string;
  description: string;
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  { id: 'REQ-001', label: 'Adaptive Cruise Control', type: TraceType.REQUIREMENT, status: 'Approved', description: 'System must maintain set speed and safe distance from vehicle ahead.' },
  { id: 'REQ-002', label: 'Emergency Braking', type: TraceType.REQUIREMENT, status: 'Approved', description: 'System must automatically engage brakes when collision is imminent.' },
  { id: 'REQ-003', label: 'Lane Keep Assist', type: TraceType.REQUIREMENT, status: 'Draft', description: 'System provides steering torque to keep vehicle within detected lane markers.' },
  { id: 'REQ-004', label: 'Blind Spot Detection', type: TraceType.REQUIREMENT, status: 'Approved', description: 'Visual alert in side mirror when obstacle detected in blind zone.' },
  
  { id: 'ARCH-101', label: 'Module: Radar Sensor Interface', type: TraceType.DESIGN, status: 'Approved', description: 'Handles raw data frames from MMIC radar unit via Ethernet.' },
  { id: 'ARCH-102', label: 'Module: Brake Actuator Logic', type: TraceType.DESIGN, status: 'Draft', description: 'Computes required deceleration and commands hydraulic pump.' },
  
  { id: 'DD-201', label: 'radar_driver.c', type: TraceType.CODE, status: 'Verified', description: 'Low level driver implementation for radar hardware abstraction.' },
  { id: 'DD-202', label: 'brake_controller.cpp', type: TraceType.CODE, status: 'Verified', description: 'PID control loop implementation for brake pressure.' },
  
  { id: 'TC-301', label: 'Verify: Radar Signal Quality', type: TraceType.TEST, status: 'Verified', description: 'Injects known signal patterns and verifies SNR > 20dB.' },
  { id: 'TC-302', label: 'Verify: Emergency Stop Trigger', type: TraceType.TEST, status: 'Failed', description: 'Measures latency between object detection and brake pressure rise. Current: 250ms (Fail).' },
  { id: 'TC-303', label: 'Verify: Lane Departure Warning', type: TraceType.TEST, status: 'Verified', description: 'Simulate drift across solid line at 80kph.' },
];

const getTypeIcon = (type: TraceType) => {
  switch (type) {
    case TraceType.REQUIREMENT: return <FileText size={16} className="text-blue-500"/>;
    case TraceType.DESIGN: return <Box size={16} className="text-purple-500"/>;
    case TraceType.CODE: return <Code size={16} className="text-emerald-500"/>;
    case TraceType.TEST: return <Activity size={16} className="text-amber-500"/>;
    default: return <FileText size={16} className="text-slate-500"/>;
  }
};

const getStatusColor = (status: string) => {
  switch(status) {
    case 'Verified': return 'bg-green-100 text-green-700';
    case 'Approved': return 'bg-blue-100 text-blue-700';
    case 'Draft': return 'bg-slate-100 text-slate-600';
    case 'Failed': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};

// --- Components ---

const CitationDetails: React.FC<{ item: KnowledgeItem, onClose: () => void }> = ({ item, onClose }) => {
  return (
    <div className="w-80 border-l border-slate-200 bg-white h-full shadow-xl animate-in slide-in-from-right-10 flex flex-col">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-700 flex items-center">
          <span className="mr-2">{getTypeIcon(item.type)}</span>
          Details
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-4">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">ID</span>
           <span className="text-lg font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{item.id}</span>
        </div>
        
        <div className="mb-4">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</span>
           <h4 className="text-md font-semibold text-slate-800 leading-tight">{item.label}</h4>
        </div>

        <div className="mb-4">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
             {item.status}
           </span>
        </div>

        <div className="mb-6">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
           <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
             {item.description}
           </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
           <button className="w-full py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center">
              <ExternalLink size={14} className="mr-2"/> View in Trace Matrix
           </button>
        </div>
      </div>
    </div>
  );
};

const FormattedMessage: React.FC<{ content: string, onCitationClick: (id: string) => void }> = ({ content, onCitationClick }) => {
  // Regex to match IDs like REQ-001, ARCH-102, DD-200, TC-300
  const regex = /((?:REQ|ARCH|DD|TC)-\d+)/g;
  const parts = content.split(regex);

  return (
    <div className="prose prose-sm max-w-none text-slate-700">
      {parts.map((part, index) => {
        if (regex.test(part)) {
          // Check if we have this item in knowledge base
          const exists = KNOWLEDGE_BASE.some(k => k.id === part);
          if (exists) {
            return (
              <button 
                key={index}
                onClick={() => onCitationClick(part)}
                className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition-all font-mono text-xs font-bold align-baseline transform hover:scale-105 active:scale-95"
                title="Click to view details"
              >
                {part}
              </button>
            );
          }
          return <span key={index} className="font-mono text-slate-500">{part}</span>;
        }
        
        // Render regular text (handling newlines)
        return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br/>') }} />;
      })}
    </div>
  );
};

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Hello! I am your AutoTrace AI assistant. I have access to your project artifacts (Requirements, Tests, Architecture). Ask me about traceability gaps or specific items like REQ-001.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<KnowledgeItem | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeCitation]);

  const handleCitationClick = (id: string) => {
    const item = KNOWLEDGE_BASE.find(k => k.id === id);
    if (item) {
      setActiveCitation(item);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const responseText = await generateAIResponse(userMsg.content, history);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm having trouble connecting to the network right now.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="bg-white border-b border-slate-200 p-4 shadow-sm flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">AutoTrace AI Assistant</h2>
              <p className="text-xs text-green-500 flex items-center font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Context Aware • Gemini 2.5 Flash
              </p>
            </div>
          </div>
          {!process.env.API_KEY && (
            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs border border-amber-200">
              <AlertCircle size={14} className="mr-1" />
              Missing API Key
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2 mt-1 flex-shrink-0">
                  <Bot size={18} />
                </div>
              )}
              
              <div 
                className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 rounded-tl-none'
                }`}
              >
                {msg.role === 'user' ? (
                   <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                ) : (
                   <FormattedMessage content={msg.content} onCitationClick={handleCitationClick} />
                )}
                
                <div className={`text-[10px] mt-2 opacity-70 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 ml-2 mt-1 flex-shrink-0">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-center ml-10">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-400 ml-2">Analyzing Project Data...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask: 'Is there a test for REQ-001?' or 'Show me failed tests'"
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all shadow-inner"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Citation Details Sidebar */}
      {activeCitation && (
        <CitationDetails 
          item={activeCitation} 
          onClose={() => setActiveCitation(null)} 
        />
      )}
    </div>
  );
};