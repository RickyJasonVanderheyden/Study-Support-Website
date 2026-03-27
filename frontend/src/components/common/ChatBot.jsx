import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronRight } from 'lucide-react';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your SLIIT Academic Assistant. How can I help you today?", sender: 'bot', time: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const quickActions = [
        { label: 'Find group members', query: 'How do I find group members?' },
        { label: 'Create a team', query: 'How to create a new group?' },
        { label: 'Semester rules', query: 'What are the semester group rules?' },
        { label: 'Contact Admin', query: 'How to contact admin?' }
    ];

    const generateResponse = (query) => {
        const q = query.toLowerCase();
        if (q.includes('group') || q.includes('member') || q.includes('team')) {
            return `At SLIIT, you can form groups within your assigned Sub-Group (~60 students). Teams are capped at 4 members. Go to the "Member Finder" tab to see available classmates!`;
        }
        if (q.includes('admin') || q.includes('support')) {
            return `You can contact the academic admin for placement issues. Current admin system allows whitelisting via IT numbers.`;
        }
        if (q.includes('hi') || q.includes('hello')) {
            return `Hello ${user?.name || 'there'}! I'm here to help with your academic tracking and group formation. What's on your mind?`;
        }
        return "That's a great question! I'm still learning, but you can find most information in the Member Finder or Dashboard sections. Would you like me to explain group formation rules?";
    };

    const handleSend = (text = inputValue) => {
        if (!text.trim()) return;

        const newUserMsg = { id: Date.now(), text, sender: 'user', time: new Date() };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI thinking
        setTimeout(() => {
            const botResponse = {
                id: Date.now() + 1,
                text: generateResponse(text),
                sender: 'bot',
                time: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 flex items-center justify-between text-white shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <Sparkles size={20} className="text-yellow-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Study Assistant</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-white/80 font-medium">Online & Ready</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50/50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1
                                        ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-white shadow-sm border border-gray-100'}`}
                                    >
                                        {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-600" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm
                                        ${msg.sender === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}
                                    >
                                        <p className="leading-relaxed">{msg.text}</p>
                                        <p className={`text-[9px] mt-1.5 font-medium ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        {messages.length < 3 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(action.query)}
                                        className="text-[11px] bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all font-medium flex items-center gap-1"
                                    >
                                        {action.label}
                                        <ChevronRight size={10} />
                                    </button>
                                ))}
                            </div>
                        )}
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="relative flex items-center"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask about groups or academic rules..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className={`absolute right-2 p-2 rounded-xl transition-all
                                    ${inputValue.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-300'}`}
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
                    ${isOpen ? 'bg-white text-gray-500 border border-gray-100' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rotate-0'}`}
            >
                {isOpen ? <X size={24} /> : (
                    <div className="relative">
                        <MessageSquare size={24} strokeWidth={2.5} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-indigo-600 rounded-full" />
                    </div>
                )}
            </button>
        </div>
    );
};

export default ChatBot;
