import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Mic,
    MicOff,
    Trash2,
    Sparkles,
    ChefHat,
    Loader,
    AlertCircle
} from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { usePantryStore, useUIStore } from '../stores';
import { sendChatMessage, quickPrompts } from '../services/chatService';
import './Chat.css';

export default function Chat() {
    const { messages, addMessage, clearMessages, isLoading, setLoading } = useChatStore();
    const { ingredients } = usePantryStore();
    const { addToast } = useUIStore();

    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        setInput('');
        addMessage({ role: 'user', content: messageText });
        setLoading(true);

        try {
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            const response = await sendChatMessage(messageText, ingredients, conversationHistory);
            addMessage({
                role: 'assistant',
                content: response.message,
                recipes: response.recipes,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
            addToast({ type: 'error', message: errorMessage });
            addMessage({
                role: 'assistant',
                content: "I'm sorry, I couldn't process that request. Please make sure your API key is configured correctly.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            addToast({ type: 'error', message: 'Voice input not supported in this browser' });
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Auto-send after voice input
            setTimeout(() => handleSend(transcript), 300);
        };

        recognition.onerror = () => {
            setIsListening(false);
            addToast({ type: 'error', message: 'Voice recognition failed' });
        };

        recognition.start();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatMessage = (content: string) => {
        // Enhanced markdown-like formatting
        return content
            .split('\n')
            .map((line, i) => {
                // Headers
                if (line.startsWith('### ')) {
                    return <h4 key={i} className="chat-h4">{formatInline(line.slice(4))}</h4>;
                }
                if (line.startsWith('## ')) {
                    return <h3 key={i} className="chat-h3">{formatInline(line.slice(3))}</h3>;
                }
                if (line.startsWith('# ')) {
                    return <h2 key={i} className="chat-h2">{formatInline(line.slice(2))}</h2>;
                }

                // Horizontal rule
                if (line.match(/^[-]{3,}$/)) {
                    return <hr key={i} className="chat-hr" />;
                }

                // Numbered lists
                if (line.match(/^\d+\.\s/)) {
                    return (
                        <p key={i} className="chat-list-item numbered">
                            {formatInline(line)}
                        </p>
                    );
                }

                // Bullet lists
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                        <p key={i} className="chat-list-item bullet">
                            <span className="bullet-point">•</span>
                            {formatInline(line.slice(2))}
                        </p>
                    );
                }

                // Empty lines
                if (!line.trim()) {
                    return <br key={i} />;
                }

                // Regular paragraphs
                return <p key={i}>{formatInline(line)}</p>;
            });
    };

    // Format inline elements (bold, italic, code)
    const formatInline = (text: string) => {
        // Split on patterns but preserve them
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

        return parts.map((part, i) => {
            // Bold
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            // Italic
            if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                return <em key={i}>{part.slice(1, -1)}</em>;
            }
            // Inline code
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="chat-inline-code">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    return (
        <div className="page chat-page">
            <header className="chat-header">
                <div className="chat-header-content">
                    <div className="chat-avatar">
                        <Sparkles size={24} />
                    </div>
                    <div className="chat-header-text">
                        <h1>DinnerHelp AI</h1>
                        <span className="chat-status">
                            {ingredients.length} ingredients in pantry
                        </span>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={clearMessages}
                        title="Clear chat"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </header>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">
                            <ChefHat size={64} />
                        </div>
                        <h2>What's for dinner?</h2>
                        <p>
                            I know everything about your pantry and can help you decide
                            what to cook. Ask me anything!
                        </p>

                        {ingredients.length === 0 && (
                            <div className="chat-warning">
                                <AlertCircle size={16} />
                                <span>Add ingredients to your pantry for personalized suggestions</span>
                            </div>
                        )}

                        <div className="quick-prompts">
                            {quickPrompts.map((prompt, index) => (
                                <motion.button
                                    key={index}
                                    className="quick-prompt"
                                    onClick={() => handleSend(prompt.prompt)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    disabled={isLoading}
                                >
                                    <span className="quick-prompt-emoji">{prompt.emoji}</span>
                                    <span>{prompt.text}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                className={`chat-message ${message.role}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {message.role === 'assistant' && (
                                    <div className="message-avatar">
                                        <Sparkles size={16} />
                                    </div>
                                )}
                                <div className="message-content">
                                    {formatMessage(message.content)}
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div
                                className="chat-message assistant"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="message-avatar">
                                    <Sparkles size={16} />
                                </div>
                                <div className="message-content loading">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts when there are messages */}
            {messages.length > 0 && !isLoading && (
                <div className="quick-prompts-bar">
                    {quickPrompts.slice(0, 4).map((prompt, index) => (
                        <button
                            key={index}
                            className="quick-prompt-pill"
                            onClick={() => handleSend(prompt.prompt)}
                        >
                            {prompt.emoji} {prompt.text}
                        </button>
                    ))}
                </div>
            )}

            <div className="chat-input-container">
                <div className="chat-input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        className="chat-input"
                        placeholder="Ask about dinner ideas..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className={`voice-btn ${isListening ? 'listening' : ''}`}
                        onClick={handleVoiceInput}
                        disabled={isLoading}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                        className="send-btn"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading ? <Loader size={20} className="spinner" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
