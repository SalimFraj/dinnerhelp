import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, X, Loader } from 'lucide-react';
import { useUIStore, usePantryStore } from '../../stores';
import { useNavigate } from 'react-router-dom';
import './VoiceModal.css';

// Check if speech recognition is supported
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function VoiceModal() {
    const navigate = useNavigate();
    const { setVoiceListening, addToast } = useUIStore();
    const { addIngredient } = usePantryStore();
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'listening' | 'processing' | 'success' | 'error'>('listening');

    const processCommand = useCallback((text: string) => {
        const lowerText = text.toLowerCase().trim();
        setIsProcessing(true);
        setStatus('processing');

        // Add ingredient command
        if (lowerText.startsWith('add ')) {
            const ingredientText = lowerText.replace('add ', '').trim();
            if (ingredientText) {
                // Split by "and", ",", "plus", or "&" to handle multiple ingredients
                const ingredientParts = ingredientText
                    .split(/\s*(?:,|\band\b|\bplus\b|&)\s*/i)
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                const addedItems: string[] = [];

                ingredientParts.forEach(ingredient => {
                    // Parse quantity if present (e.g., "2 pounds of chicken")
                    const quantityMatch = ingredient.match(/^(\d+(?:\.\d+)?)\s*(pounds?|lbs?|oz|ounces?|cups?|tbsp|tsp|kg|g|grams?)?(?:\s+of\s+|\s+)?(.+)/i);

                    if (quantityMatch) {
                        const [, qty, unit, name] = quantityMatch;
                        addIngredient({
                            name: name.trim(),
                            quantity: parseFloat(qty),
                            unit: unit || 'unit',
                            category: 'other',
                        });
                        addedItems.push(name.trim());
                    } else {
                        addIngredient({
                            name: ingredient,
                            quantity: 1,
                            unit: 'unit',
                            category: 'other',
                        });
                        addedItems.push(ingredient);
                    }
                });

                setStatus('success');
                const message = addedItems.length > 1
                    ? `Added ${addedItems.length} items: ${addedItems.join(', ')}`
                    : `Added ${addedItems[0]} to pantry`;
                addToast({ type: 'success', message });
                setTimeout(() => setVoiceListening(false), 1500);
                return;
            }
        }

        // Navigation commands
        if (lowerText.includes('go to') || lowerText.includes('open') || lowerText.includes('show')) {
            if (lowerText.includes('pantry')) {
                navigate('/pantry');
                setStatus('success');
                setTimeout(() => setVoiceListening(false), 500);
                return;
            }
            if (lowerText.includes('recipe')) {
                navigate('/recipes');
                setStatus('success');
                setTimeout(() => setVoiceListening(false), 500);
                return;
            }
            if (lowerText.includes('shopping') || lowerText.includes('shop')) {
                navigate('/shopping');
                setStatus('success');
                setTimeout(() => setVoiceListening(false), 500);
                return;
            }
            if (lowerText.includes('plan') || lowerText.includes('calendar')) {
                navigate('/meal-plan');
                setStatus('success');
                setTimeout(() => setVoiceListening(false), 500);
                return;
            }
            if (lowerText.includes('chat') || lowerText.includes('ai')) {
                navigate('/chat');
                setStatus('success');
                setTimeout(() => setVoiceListening(false), 500);
                return;
            }
            if (lowerText.includes('home')) {
                navigate('/');
                setStatus('success');
                setTimeout(() => setVoiceListening(false), 500);
                return;
            }
        }

        // AI Chat commands - redirect to chat page
        if (lowerText.includes('what can i make') || lowerText.includes('what should i cook') ||
            lowerText.includes('dinner idea') || lowerText.includes('suggest') ||
            lowerText.includes('help me cook') || lowerText.includes('ask ai')) {
            navigate('/chat');
            setStatus('success');
            addToast({ type: 'info', message: 'Opening AI Chat...' });
            setTimeout(() => setVoiceListening(false), 500);
            return;
        }

        // Unknown command
        setStatus('error');
        addToast({ type: 'warning', message: "Sorry, I didn't understand that command" });
        setTimeout(() => {
            setStatus('listening');
            setIsProcessing(false);
            setTranscript('');
        }, 2000);
    }, [addIngredient, addToast, navigate, setVoiceListening]);

    useEffect(() => {
        if (!SpeechRecognition) {
            addToast({ type: 'error', message: 'Voice recognition not supported in this browser' });
            setVoiceListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const result = event.results[current];
            const text = result[0].transcript;
            setTranscript(text);

            if (result.isFinal) {
                processCommand(text);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'aborted') {
                addToast({ type: 'error', message: 'Voice recognition error. Please try again.' });
            }
            setVoiceListening(false);
        };

        recognition.onend = () => {
            if (!isProcessing) {
                // Restart if no command was processed
                try {
                    recognition.start();
                } catch (e) {
                    // Already started or modal closed
                }
            }
        };

        recognition.start();

        return () => {
            recognition.abort();
        };
    }, [addToast, setVoiceListening, processCommand, isProcessing]);

    const close = () => {
        setVoiceListening(false);
    };

    return (
        <motion.div
            className="voice-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
        >
            <motion.div
                className="voice-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="voice-modal-close" onClick={close}>
                    <X size={24} />
                </button>

                <div className={`voice-indicator ${status}`}>
                    {status === 'processing' ? (
                        <Loader size={32} className="voice-loader" />
                    ) : (
                        <Mic size={32} />
                    )}
                    <div className="voice-rings">
                        <span className="voice-ring" />
                        <span className="voice-ring" />
                        <span className="voice-ring" />
                    </div>
                </div>

                <div className="voice-content">
                    <h3 className="voice-title">
                        {status === 'listening' && "I'm listening..."}
                        {status === 'processing' && 'Processing...'}
                        {status === 'success' && 'Got it!'}
                        {status === 'error' && 'Try again'}
                    </h3>

                    <p className="voice-transcript">
                        {transcript || 'Say a command like "Add chicken" or "Show recipes"'}
                    </p>

                    <div className="voice-hints">
                        <span className="voice-hint">"Add [ingredient]"</span>
                        <span className="voice-hint">"What can I make?"</span>
                        <span className="voice-hint">"Go to pantry"</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
