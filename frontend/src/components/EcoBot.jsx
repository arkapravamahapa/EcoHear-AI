import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/api';

const EcoBot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello Ranger! I am EcoBot. I analyze live acoustic data stream pipelines and ecosystem health trends. How can I assist your patrol today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const data = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Connection timeout. Unable to ping main edge core gateway.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl max-w-4xl mx-auto h-[600px] flex flex-col mt-6 overflow-hidden">
      
      {/* Bot Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <Bot className="text-[#20C997] size-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">EcoBot Core</h3>
          <span className="flex items-center gap-1.5 text-[11px] text-[#20C997] font-medium mt-0.5">
            <span className="w-1.5 h-1.5 bg-[#20C997] rounded-full animate-pulse"></span> Online & Secure
          </span>
        </div>
      </div>

      {/* Message Output Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
              msg.sender === 'user' ? 'bg-[#20C997]/20 border-[#20C997]/30 text-[#20C997]' : 'bg-white/10 border-white/10 text-emerald-100/70'
            }`}>
              {msg.sender === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
              msg.sender === 'user' ? 'bg-[#20C997] text-white rounded-tr-none' : 'bg-white/5 text-emerald-100/90 border border-white/5 rounded-tl-none shadow-xl'
            }`}>
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-emerald-100/70 flex items-center justify-center">
              <Bot className="size-4" />
            </div>
            <div className="p-4 rounded-2xl text-sm bg-white/5 border border-white/5 rounded-tl-none flex items-center gap-2 text-emerald-100/50">
              <Loader2 className="w-4 h-4 animate-spin text-[#20C997]" /> EcoBot is querying edge logs...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20 flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask EcoBot to analyze sector telemetry data or logs..."
          disabled={isLoading}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-[#20C997]/50 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-[#20C997] hover:bg-emerald-400 text-white p-3 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-900/20"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
};

export default EcoBot;