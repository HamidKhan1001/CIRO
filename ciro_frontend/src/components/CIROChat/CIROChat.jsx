import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX,
  ShieldAlert, AlertTriangle, CheckCircle2, Loader2, Zap, ChevronDown
} from 'lucide-react';

const API_BASE = (import.meta.env?.VITE_API_URL) || 'http://localhost:8000';

const QUICK_ACTIONS = [
  { label: '🌊 Report Flooding', message: 'I see flooding in my area, what should I do?' },
  { label: '🔥 Fire Nearby', message: 'There is a fire near my location, help!' },
  { label: '🏥 Need Ambulance', message: 'Someone is injured and needs immediate medical help.' },
  { label: '⚡ Power Outage', message: 'We have a power outage in our neighborhood.' },
  { label: '📍 My Safety', message: 'Is my current location safe?' },
  { label: '🚗 Road Block', message: 'There is a major road blockage I want to report.' },
];

const severityConfig = {
  safe: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle2, label: 'SAFE' },
  caution: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: AlertTriangle, label: 'CAUTION' },
  danger: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: AlertTriangle, label: 'DANGER' },
};

function MessageBubble({ msg, onSpeak, isSpeaking }) {
  const isUser = msg.role === 'user';
  const sev = msg.severity ? severityConfig[msg.severity] : null;
  const SevIcon = sev?.icon;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black
        ${isUser ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30'}`}>
        {isUser ? 'U' : <ShieldAlert className="w-4 h-4" />}
      </div>

      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Main bubble */}
        <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white/[0.06] backdrop-blur border border-white/10 text-gray-100 rounded-bl-sm'
          }`}>
          {msg.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span className="text-gray-400 text-xs">CIRO is thinking...</span>
            </div>
          ) : (
            <p>{msg.text}</p>
          )}

          {/* Severity badge */}
          {sev && !msg.isLoading && (
            <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black tracking-widest ${sev.bg} ${sev.color}`}>
              <SevIcon className="w-2.5 h-2.5" />
              {sev.label}
            </div>
          )}
        </div>

        {/* AI suggestions */}
        {!isUser && msg.suggestions?.length > 0 && !msg.isLoading && (
          <div className="space-y-1.5 w-full">
            {msg.suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/8 rounded-xl text-xs text-gray-300">
                <Zap className="w-3 h-3 text-blue-400 flex-shrink-0" />
                {s}
              </div>
            ))}
          </div>
        )}

        {/* TTS button for AI messages */}
        {!isUser && !msg.isLoading && msg.text && (
          <button
            onClick={() => onSpeak(msg.text)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all
              ${isSpeaking ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            {isSpeaking ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            {isSpeaking ? 'Speaking...' : 'Read aloud'}
          </button>
        )}

        {/* Timestamp */}
        <span className="text-[9px] text-gray-600 px-1">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export const CIROChat = ({ userPosition }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: "Hi! I'm CIRO, your Crisis Intelligence Assistant. I can help you report incidents, check safety status, or guide you through an emergency. How can I help?",
      suggestions: ['Report an incident', 'Check area safety', 'Find emergency contacts'],
      severity: 'safe',
      ts: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakId, setActiveSpeakId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread when closed and new AI message arrives
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasUnread(true);
    }
  }, [messages.length]);

  useEffect(() => {
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  // Setup Speech Recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const speakText = useCallback((text, msgId) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeakId(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.lang = 'en-US';

    // Prefer a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha'));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => { setIsSpeaking(true); setActiveSpeakId(msgId); };
    utter.onend = () => { setIsSpeaking(false); setActiveSpeakId(null); };
    utter.onerror = () => { setIsSpeaking(false); setActiveSpeakId(null); };
    window.speechSynthesis.speak(utter);
  }, [isSpeaking]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed, ts: Date.now() };
    const loadingId = Date.now() + 1;
    const loadingMsg = { id: loadingId, role: 'ai', text: '', isLoading: true, ts: Date.now() };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          location: userPosition || null,
          context: messages.slice(-3).map(m => `${m.role}: ${m.text}`).join(' | '),
        }),
      });

      const data = await res.json();
      const aiMsg = {
        id: loadingId,
        role: 'ai',
        text: data.response || 'I received your message.',
        suggestions: data.suggestions || [],
        severity: data.severity || 'safe',
        escalate: data.escalate || false,
        ts: Date.now(),
        isLoading: false,
      };

      setMessages(prev => prev.map(m => m.id === loadingId ? aiMsg : m));

      // Auto-speak AI response if short
      if (data.response && data.response.length < 200) {
        speakText(data.response, loadingId);
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === loadingId ? {
          ...m,
          isLoading: false,
          text: 'Connection error. Please check your network or call emergency services directly.',
          severity: 'caution',
          suggestions: ['Call 15 (Police)', 'Call 1122 (Ambulance)'],
        } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userPosition, messages, speakText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat — fixed to viewport, safe for all screen sizes */}
      <div className="fixed bottom-5 right-4 md:bottom-6 md:right-6 z-[999] flex flex-col items-end gap-3">
        {/* Unread badge & chat panel */}
        {isOpen && (
          <div
            className="flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
            style={{
              width: 'min(calc(100vw - 2rem), 420px)',
              height: 'min(85vh, 600px)',
              background: 'rgba(10, 14, 26, 0.92)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.15))' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">CIRO Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">AI Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                    className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onSpeak={(text) => speakText(text, msg.id)}
                  isSpeaking={isSpeaking && activeSpeakId === msg.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {showQuickActions && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Quick Actions</span>
                  <button onClick={() => setShowQuickActions(false)} className="ml-auto text-gray-600 hover:text-gray-400">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => sendMessage(qa.message)}
                      className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 rounded-xl text-xs text-gray-300 hover:text-white transition-all whitespace-nowrap"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(37,99,235,0.15)] transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? '🎤 Listening...' : 'Type or speak your message...'}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                  disabled={isLoading}
                />
                {/* Voice Input */}
                <button
                  onClick={toggleListening}
                  className={`p-1.5 rounded-xl transition-all ${isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10'}`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send */}
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {/* Voice status */}
              {isListening && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="w-1 bg-red-400 rounded-full animate-pulse"
                        style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className="text-xs text-red-400 font-bold">Listening...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl
            ${isOpen
              ? 'bg-white/10 border border-white/20 text-white'
              : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:shadow-[0_0_40px_rgba(37,99,235,0.7)] hover:scale-110'
            }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg animate-bounce">
              !
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};
