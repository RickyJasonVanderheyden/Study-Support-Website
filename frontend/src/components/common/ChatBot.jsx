import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronRight, Loader2, Check, XCircle, Shield } from 'lucide-react';
import { askChatbot, executeChatAction } from '../../services/module4Api';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'instructor';

    // Initial welcome message
    useEffect(() => {
        const welcome = {
            id: 1, sender: 'bot', time: new Date(),
            text: isAdmin
                ? "Hi! I'm your SLIIT Member Finder Assistant (Admin). I can show you all groups, unassigned students, activity logs, and platform stats. Try asking me something!"
                : "Hi! I'm your SLIIT Member Finder Assistant. I can help you find groups, discover teammates, manage invitations, and understand group rules. Try asking me something!",
            suggestions: isAdmin
                ? ['Show all groups', 'Give me a summary', 'Show recent activity', 'What are the rules?']
                : ['What groups are available?', 'Who\'s in my class?', 'What groups am I in?', 'What are the rules?']
        };
        setMessages([welcome]);
    }, [isAdmin]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);
    useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

    // Build conversation history for multi-turn context
    const buildHistory = () => {
        return messages
            .filter(m => m.id !== 1) // skip welcome
            .slice(-10) // last 10 messages
            .map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
    };

    const handleSend = async (text = inputValue) => {
        if (!text.trim() || isTyping) return;

        const userMsg = { id: Date.now(), text: text.trim(), sender: 'user', time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const history = buildHistory();
            const res = await askChatbot(text.trim(), history);
            const { reply, suggestions, action } = res.data;

            const botMsg = {
                id: Date.now() + 1, text: reply, sender: 'bot', time: new Date(),
                suggestions: suggestions || [],
                action: action || null // { type, userId, groupId, invitationId, label }
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            const errorReply = err.response?.data?.reply || 'Sorry, I couldn\'t process that. Please try again!';
            setMessages(prev => [...prev, {
                id: Date.now() + 1, text: errorReply, sender: 'bot', time: new Date(),
                suggestions: ['What groups are available?', 'What are the rules?']
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Execute a confirmed action (invite, accept, decline)
    const handleAction = async (action, confirmed) => {
        if (!confirmed) {
            setMessages(prev => [...prev, {
                id: Date.now(), text: '❌ Cancelled.', sender: 'bot', time: new Date(),
                suggestions: ['What groups are available?', 'What groups am I in?']
            }]);
            return;
        }

        setIsExecuting(true);
        try {
            const res = await executeChatAction(action);
            setMessages(prev => [...prev, {
                id: Date.now(), text: res.data.reply, sender: 'bot', time: new Date(),
                suggestions: ['What groups am I in?', 'What groups are available?']
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now(), text: err.response?.data?.reply || 'Action failed. Please try again.',
                sender: 'bot', time: new Date()
            }]);
        } finally {
            setIsExecuting(false);
        }
    };

    const formatMessage = (text) => {
        return text.split('\n').map((line, i) => {
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return (
                <span key={i}>
                    <span dangerouslySetInnerHTML={{ __html: formatted }} />
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            );
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[400px] h-[580px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ animation: 'chatSlideUp 0.3s ease-out' }}>
                    {/* Header */}
                    <div className={`p-5 flex items-center justify-between text-white shadow-lg shrink-0 ${isAdmin ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                {isAdmin ? <Shield size={20} className="text-amber-200" /> : <Sparkles size={20} className="text-emerald-200" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{isAdmin ? 'Member Finder Assistant (Admin)' : 'Member Finder Assistant'}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-white/80 font-medium">AI-Powered · Groq LLM</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50/50">
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1
                                            ${msg.sender === 'user'
                                                ? (isAdmin ? 'bg-amber-600' : 'bg-emerald-600')
                                                : 'bg-white shadow-sm border border-gray-100'}`}>
                                            {msg.sender === 'user'
                                                ? <User size={14} className="text-white" />
                                                : <Bot size={14} className={isAdmin ? 'text-amber-600' : 'text-emerald-600'} />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm shadow-sm
                                            ${msg.sender === 'user'
                                                ? `${isAdmin ? 'bg-amber-600' : 'bg-emerald-600'} text-white rounded-tr-none`
                                                : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>
                                            <div className="leading-relaxed whitespace-pre-wrap text-left">
                                                {msg.sender === 'bot' ? formatMessage(msg.text) : msg.text}
                                            </div>
                                            <p className={`text-[9px] mt-1.5 font-medium ${msg.sender === 'user' ? (isAdmin ? 'text-amber-200' : 'text-emerald-200') : 'text-gray-400'}`}>
                                                {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons (Confirm / Cancel) */}
                                {msg.sender === 'bot' && msg.action && (
                                    <div className="flex gap-2 mt-2 ml-9">
                                        <button
                                            onClick={() => handleAction(msg.action, true)}
                                            disabled={isExecuting}
                                            className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all font-semibold disabled:opacity-50"
                                        >
                                            <Check size={14} /> {isExecuting ? 'Processing...' : 'Confirm'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(msg.action, false)}
                                            disabled={isExecuting}
                                            className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-100 transition-all font-semibold disabled:opacity-50"
                                        >
                                            <XCircle size={14} /> Cancel
                                        </button>
                                    </div>
                                )}

                                {/* Suggestion chips */}
                                {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && !msg.action && (
                                    <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                                        {msg.suggestions.map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(suggestion)}
                                                disabled={isTyping}
                                                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all font-medium flex items-center gap-1 disabled:opacity-50
                                                    ${isAdmin
                                                        ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 hover:border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'}`}
                                            >
                                                {suggestion}
                                                <ChevronRight size={10} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 items-start">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm border border-gray-100">
                                        <Bot size={14} className={isAdmin ? 'text-amber-600' : 'text-emerald-600'} />
                                    </div>
                                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                                        <Loader2 size={14} className={`${isAdmin ? 'text-amber-500' : 'text-emerald-500'} animate-spin`} />
                                        <span className="text-xs text-gray-400 font-medium">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Scope info */}
                    {user?.year && (
                        <div className={`px-4 py-1.5 border-t shrink-0 ${isAdmin ? 'bg-amber-50/80 border-amber-100' : 'bg-emerald-50/80 border-emerald-100'}`}>
                            <p className={`text-[10px] font-medium text-center ${isAdmin ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {isAdmin ? '🛡️ Admin mode — viewing all sub-groups' : `🎯 Scoped to: ${user.year} · ${user.semester} · MG${String(user.mainGroup || 1).padStart(2, '0')} · SG${user.subGroup || 1}`}
                            </p>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={isAdmin ? "Ask Member Finder Assistant about groups, students..." : "Ask Member Finder Assistant about groups, members..."}
                                disabled={isTyping || isExecuting}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping || isExecuting}
                                className={`absolute right-2 p-2 rounded-xl transition-all
                                    ${inputValue.trim() && !isTyping ? `${isAdmin ? 'bg-amber-600' : 'bg-emerald-600'} text-white shadow-lg` : 'bg-gray-100 text-gray-300'}`}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95
                    ${isOpen ? 'bg-white text-gray-500 border border-gray-100' :
                      `bg-gradient-to-br ${isAdmin ? 'from-amber-600 to-orange-600' : 'from-emerald-600 to-teal-600'} text-white`}`}
            >
                {isOpen ? <X size={24} /> : (
                    <div className="relative">
                        <MessageSquare size={24} strokeWidth={2.5} />
                        <div className={`absolute -top-1 -right-1 w-3 h-3 border-2 rounded-full animate-pulse ${isAdmin ? 'bg-amber-400 border-amber-600' : 'bg-emerald-400 border-emerald-600'}`} />
                    </div>
                )}
            </button>

            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ChatBot;

