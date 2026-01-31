import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Mic,
    MicOff,
    Trash2,
    Sparkles,
    ChefHat,
    Loader,
    ArrowUp
} from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { usePantryStore, useUIStore, useRecipeStore } from '../stores';
import { sendChatMessage, quickPrompts } from '../services/chatService';
import './Chat.css';

export default function Chat() {
    const navigate = useNavigate();
    // Stores
    const { messages, addMessage, clearMessages, isLoading, setLoading } = useChatStore();
    const { ingredients } = usePantryStore();
    const { addRecipe } = useRecipeStore();
    const { addToast } = useUIStore();

    // ... (rest of local state)

    const handleSaveRecipe = (recipe: any) => {
        const newRecipe = {
            ...recipe,
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isCustom: true,
            source: 'ai' as const,
            isFavorite: false,
            rating: 0,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || []
        };
        addRecipe(newRecipe);
        addToast({ type: 'success', message: 'Recipe saved to My Recipes!' });
    };

    const handleRecipeClick = (recipe: any) => {
        // Construct a clean recipe object for the view
        const viewingRecipe = {
            ...recipe,
            id: recipe.id || `ai-${Date.now()}`,
            isCustom: true,
            source: 'ai' as const,
            isFavorite: false,
            rating: 0,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || []
        };
        navigate(`/recipes/${viewingRecipe.id}`, { state: { recipe: viewingRecipe } });
    };

    // Local State
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Message Handling ---
    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        setInput('');
        addMessage({ role: 'user', content: messageText });
        setLoading(true);

        try {
            // Include basic history (last 10 messages to keep context but save tokens)
            const recentHistory = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content,
            }));

            const response = await sendChatMessage(messageText, ingredients, recentHistory);

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
                content: "I'm having trouble connecting to the kitchen server. Please try again or check your API key.",
            });
        } finally {
            setLoading(false);
            // Focus input after send for desktop, maybe not mobile to prevent keyboard pop
            if (window.innerWidth > 768) {
                inputRef.current?.focus();
            }
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
            setTimeout(() => handleSend(transcript), 400);
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

    // --- Markdown Formatting ---
    const formatMessage = (content: string) => {
        // Simple parser for bold, italic, code, list
        return content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;

            // Headers
            if (line.startsWith('### ')) return <h4 key={i}>{formatInline(line.slice(4))}</h4>;
            if (line.startsWith('## ')) return <h3 key={i}>{formatInline(line.slice(3))}</h3>;

            // Lists
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return (
                    <li key={i} style={{ marginLeft: '1rem', listStyle: 'disc' }}>
                        {formatInline(line.replace(/^[-*]\s/, ''))}
                    </li>
                );
            }
            if (line.match(/^\d+\.\s/)) {
                return (
                    <li key={i} style={{ marginLeft: '1rem', listStyle: 'decimal' }}>
                        {formatInline(line.replace(/^\d+\.\s/, ''))}
                    </li>
                );
            }

            return <p key={i}>{formatInline(line)}</p>;
        });
    };

    const formatInline = (text: string) => {
        // Parse **bold**, *italic*, `code`
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**'))
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('`') && part.endsWith('`'))
                return <code key={i} className="chat-inline-code">{part.slice(1, -1)}</code>;
            return part;
        });
    };

    return (
        <div className="chat-page">
            {/* Header / Actions */}
            <header className="chat-header">
                {messages.length > 0 && (
                    <button className="clear-chat-btn" onClick={clearMessages}>
                        <Trash2 size={14} />
                        <span>Clear Chat</span>
                    </button>
                )}
            </header>

            {/* Messages Area */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state-container">
                        <div className="empty-state-icon">
                            <ChefHat size={40} />
                        </div>
                        <h2 className="empty-state-title">Sous Chef AI</h2>
                        <p className="empty-state-description">
                            I can help you cook with what you have, find substitutions, or plan meals.
                        </p>

                        <div className="quick-prompts-grid">
                            {quickPrompts.map((prompt, index) => (
                                <motion.button
                                    key={index}
                                    className="quick-prompt-card"
                                    onClick={() => handleSend(prompt.prompt)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <span className="quick-prompt-emoji">{prompt.emoji}</span>
                                    <span className="quick-prompt-text">{prompt.text}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                className={`message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="message-avatar">
                                        <Sparkles size={16} />
                                    </div>
                                )}

                                <div className="message-bubble">
                                    {msg.role === 'assistant' && (
                                        <div className="ai-header">
                                            <span className="ai-name">Sous Chef</span>
                                        </div>
                                    )}
                                    <div className="message-content">
                                        {formatMessage(msg.content)}

                                        {/* AI Generated Recipes Cards */}
                                        {msg.recipes && msg.recipes.length > 0 && (
                                            <div className="chat-recipe-cards">
                                                {msg.recipes.map((recipe: any) => (
                                                    <div
                                                        key={recipe.id}
                                                        className="mini-recipe-card clickable"
                                                        onClick={() => handleRecipeClick(recipe)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="mini-recipe-header">
                                                            <h4>{recipe.title}</h4>
                                                            <span className="mini-meta">{recipe.cookTime}min • {recipe.difficulty}</span>
                                                        </div>
                                                        <button
                                                            className="save-recipe-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSaveRecipe(recipe);
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div
                                className="message-row assistant-row"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="message-avatar">
                                    <Sparkles size={16} />
                                </div>
                                <div className="message-bubble">
                                    <div className="ai-header">
                                        <span className="ai-name">Thinking...</span>
                                    </div>
                                    <div className="typing-dots">
                                        <div className="typing-dot" />
                                        <div className="typing-dot" />
                                        <div className="typing-dot" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="input-area-wrapper">
                {/* Horizontal scroll of prompts for quick access */}
                {messages.length > 0 && !isLoading && (
                    <div className="mini-prompts-scroll">
                        {quickPrompts.slice(0, 5).map((p, i) => (
                            <button
                                key={i}
                                className="mini-prompt-pill"
                                onClick={() => handleSend(p.prompt)}
                            >
                                {p.emoji} {p.text}
                            </button>
                        ))}
                    </div>
                )}

                <div className="input-bar">
                    <button
                        className={`icon-btn ${isListening ? 'listening' : ''}`}
                        onClick={handleVoiceInput}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    <input
                        ref={inputRef}
                        className="chat-text-input"
                        placeholder="Ask for recipes, subs, or ideas..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />

                    <button
                        className="send-submit-btn"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading ? <Loader size={16} className="spinner" /> : <ArrowUp size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
