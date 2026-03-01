import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Loader2, RefreshCw, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  correction?: string;
  score?: number;
  suggestions?: string;
}

export default function AIConversation() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultLang = searchParams.get('lang') || user?.target_language || 'Spanish';
  
  const [language, setLanguage] = useState(defaultLang);
  const [topic, setTopic] = useState('General Conversation');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scenarios = [
    'General Conversation',
    'Ordering food at a restaurant',
    'Asking for directions',
    'Job interview',
    'Checking into a hotel',
    'Debating a topic'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'Spanish' ? 'es-ES' : 
                       language === 'French' ? 'fr-FR' : 
                       language === 'German' ? 'de-DE' : 
                       language === 'Russian' ? 'ru-RU' : 
                       language === 'Hindi' ? 'hi-IN' : 
                       language === 'Japanese' ? 'ja-JP' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
      
      const nativeLang = user?.native_language || 'English (US)';
      const proficiency = user?.proficiency || 'Beginner';
      
      let systemInstruction = `You are a helpful AI language tutor. The user's native language is ${nativeLang} and they are learning ${language}. Their proficiency level is ${proficiency}. The current topic is "${topic}".\n\n`;
      
      if (proficiency === 'Beginner') {
        systemInstruction += `Explain concepts simply in ${nativeLang}. Introduce basic ${language} vocabulary and grammar. Keep ${language} sentences very short and simple.`;
      } else if (proficiency === 'Intermediate') {
        systemInstruction += `Use a mix of ${nativeLang} and ${language}. Challenge them with moderate vocabulary and grammar in ${language}, but provide explanations in ${nativeLang} if needed.`;
      } else {
        systemInstruction += `Communicate almost entirely in ${language}. Use advanced vocabulary, complex grammar, and natural idioms. Only use ${nativeLang} if absolutely necessary for a complex correction.`;
      }

      systemInstruction += `\n\nAlso, provide a brief grammar correction if they made a mistake, and a fluency score out of 100.
      Format your response strictly as JSON:
      {
        "reply": "Your response in the appropriate language based on proficiency",
        "correction": "Grammar correction in ${nativeLang} (or null if perfect)",
        "score": 95,
        "suggestions": "One tip for improvement in ${nativeLang}"
      }`;

      // Format history for Gemini
      const formattedHistory = messages.map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`).join('\n');
      const prompt = `${formattedHistory ? `Previous conversation:\n${formattedHistory}\n\n` : ''}Student: ${userMsg.content}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      // Add XP for conversation
      fetch('/api/user/xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 5 })
      }).catch(console.error);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.reply,
        correction: data.correction,
        score: data.score,
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      // Handle error visually if needed
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
            >
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
              <option value="English">English</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Topic</label>
            <select 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 min-w-[250px]"
            >
              {scenarios.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button 
          onClick={resetChat}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <RefreshCw size={16} /> Reset Chat
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Bot size={48} className="text-indigo-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">Start practicing {language}!</p>
              <p className="text-sm mt-1">Topic: {topic}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className={`p-4 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        
                        {msg.role === 'ai' && (msg.correction || msg.score) && (
                          <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-sm text-sm">
                            {msg.score && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-700">Fluency Score:</span>
                                <span className={`font-bold ${msg.score > 80 ? 'text-emerald-600' : msg.score > 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {msg.score}/100
                                </span>
                              </div>
                            )}
                            {msg.correction && msg.correction !== "null" && (
                              <div className="mb-2">
                                <span className="font-semibold text-gray-700 block mb-1">Correction:</span>
                                <p className="text-gray-600">{msg.correction}</p>
                              </div>
                            )}
                            {msg.suggestions && (
                              <div>
                                <span className="font-semibold text-gray-700 block mb-1">Tip:</span>
                                <p className="text-gray-600 italic">{msg.suggestions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-indigo-600" />
                      <span className="text-sm text-gray-500">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
          <form onSubmit={handleSend} className="flex gap-4">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-4 rounded-xl flex items-center justify-center transition-colors ${
                isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isListening ? "Stop listening" : "Start speaking"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Type your message in ${language} or use the microphone...`}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4"
              disabled={loading || isListening}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || isListening}
              className="bg-indigo-600 text-white rounded-xl px-6 font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              Send <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
