import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import axios from 'axios';

const EcoBot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am EcoBot. I analyze acoustic data and ecosystem trends. How can I assist your patrol today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Auto-scroll reference
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      // Make sure your Vite env variable is set!
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API key is missing. Check your .env file.");
      }

      // We inject a system prompt so the AI knows its role before answering
      const systemContext = "You are EcoBot, an AI forest monitoring assistant. Keep answers brief, professional, and related to wildlife conservation, biodiversity, or illegal logging alerts.";
      const fullPrompt = `${systemContext}\n\nUser: ${userMessage}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: fullPrompt }] }]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const botReply = response.data.candidates[0].content.parts[0].text;
      
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: '⚠️ System Error: Unable to connect to the EcoBot Intelligence Server. Please check your API key.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl h-150 flex flex-col mt-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
        <div className="size-10 rounded-full bg-[#20C997]/20 flex items-center justify-center shrink-0">
          <Bot className="size-6 text-[#20C997]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">EcoBot
          </h2>
          <p className="text-xs text-emerald-100/50 flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#20C997] animate-pulse"></span> Online & Secure
          </p>
        </div>
      </div>

      {/* Chat History area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'bot' && (
              <div className="size-8 rounded-full bg-[#20C997]/20 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-[#20C997]" />
              </div>
            )}
            
            <div className={`p-3 max-w-[80%] rounded-xl text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-[#20C997] text-[#040a06] rounded-tr-none font-medium shadow-lg shadow-[#20C997]/20' 
                : 'bg-white/10 text-white rounded-tl-none border border-white/5'
            }`}>
              {msg.text}
            </div>

            {msg.sender === 'user' && (
              <div className="size-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User className="size-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="size-8 rounded-full bg-[#20C997]/20 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-[#20C997]" />
            </div>
            <div className="p-4 max-w-[80%] rounded-xl bg-white/10 text-white rounded-tl-none border border-white/5 flex items-center gap-2">
              <span className="size-2 bg-[#20C997] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="size-2 bg-[#20C997] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="size-2 bg-[#20C997] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 flex gap-3 bg-white/5 rounded-b-2xl">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
          placeholder="Ask EcoBot to analyze sector data..." 
          disabled={isTyping}
          className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] transition-all disabled:opacity-50"
        />
        <button 
          onClick={handleSend} 
          disabled={isTyping || !input.trim()}
          className="bg-[#20C997] text-[#040a06] px-4 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center min-w-14"
        >
          {isTyping ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </div>
    </div>
  );
};

export default EcoBot;