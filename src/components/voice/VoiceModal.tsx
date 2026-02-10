import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, X, Loader } from 'lucide-react';
import { useUIStore, useShoppingStore } from '../../stores';
import { useNavigate } from 'react-router-dom';
import { processVoiceIntent } from '../../services/chatService';
import { actionService } from '../../services/actionService';
import { detectShoppingCategory, suggestUnit } from '../../services/categorizationService';
import './VoiceModal.css';

// Check if speech recognition is supported
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function VoiceModal() {
    const navigate = useNavigate();
    const { setVoiceListening, addToast } = useUIStore();
    // Removed usePantryStore destructuring
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'listening' | 'processing' | 'success' | 'error'>('listening');

    const processCommand = useCallback(async (text: string) => {
        setIsProcessing(true);
        setStatus('processing');

        try {
            // Use smart intent processing
            const intent = await processVoiceIntent(text);

            switch (intent.type) {
                case 'ADD_PANTRY':
                    if (intent.items.length > 0) {
                        intent.items.forEach(item => {
                            actionService.addPantryItemSmart(item.name, item.quantity, item.unit);
                        });
                        setStatus('success');
                        const message = intent.items.length > 1
                            ? `Added ${intent.items.length} items to pantry`
                            : `Added ${intent.items[0].name} to pantry`;
                        addToast({ type: 'success', message });
                        setTimeout(() => setVoiceListening(false), 1500);
                    } else {
                        throw new Error('No items identified');
                    }
                    break;

                case 'ADD_SHOPPING':
                    // We need to implement shopping list adding, for now just use pantry smart add with category?
                    // Or redirect to shopping list? 
                    // Let's add to shopping store directly if possible, but we need the store
                    // For now, let's treat as pantry add but maybe with a toast note?
                    // Actually, let's import shopping store
                    const { addItem } = useShoppingStore.getState();
                    const { getActiveList, createList } = useShoppingStore.getState();
                    let listId = getActiveList()?.id;
                    if (!listId) listId = createList('Shopping List');

                    intent.items.forEach(item => {
                        const category = detectShoppingCategory(item.name);
                        const unit = item.unit || suggestUnit(item.name);

                        addItem(listId!, {
                            name: item.name,
                            quantity: item.quantity || 1,
                            unit: unit,
                            category: category,
                            checked: false
                        });
                    });

                    setStatus('success');
                    addToast({ type: 'success', message: `Added ${intent.items.length} items to shopping list` });
                    setTimeout(() => setVoiceListening(false), 1500);
                    break;

                case 'NAVIGATE':
                    navigate('/' + intent.page.replace(/^\//, '')); // Ensure / prefix handling
                    setStatus('success');
                    setTimeout(() => setVoiceListening(false), 500);
                    break;

                case 'CHAT':
                    useUIStore.getState().setInitialChatQuery(intent.query);
                    navigate('/chat');
                    setStatus('success');
                    setTimeout(() => setVoiceListening(false), 500);
                    break;
            }
        } catch (error) {
            console.error('Voice processing error:', error);
            setStatus('error');
            addToast({ type: 'warning', message: "Sorry, I couldn't understand that." });
            setTimeout(() => {
                setStatus('listening');
                setIsProcessing(false);
                setTranscript('');
            }, 2000);
        }
    }, [addToast, navigate, setVoiceListening]);

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
