import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight, Check, Loader, Sparkles } from 'lucide-react';
import { parseShoppingList } from '../../services/chatService';
import { useShoppingStore, useUIStore } from '../../stores';
import './ImportListModal.css';

interface Props {
    onClose: () => void;
    listId: string;
}

interface ParsedItem {
    name: string;
    quantity: number;
    category?: string;
    selected: boolean;
}

export default function ImportListModal({ onClose, listId }: Props) {
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

    const { addItem } = useShoppingStore();
    const { addToast } = useUIStore();

    const handleParse = async () => {
        if (!rawText.trim()) return;

        setIsProcessing(true);
        try {
            const items = await parseShoppingList(rawText);
            setParsedItems(items.map(i => ({ ...i, selected: true })));
            setStep('preview');
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to parse list' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = () => {
        const selected = parsedItems.filter(i => i.selected);

        selected.forEach(item => {
            addItem(listId, {
                name: item.name,
                category: (item.category as any) || 'other',
                quantity: item.quantity,
                unit: 'unit', // Simplified for now
                checked: false
            });
        });

        addToast({ type: 'success', message: `Imported ${selected.length} items` });
        onClose();
    };

    const toggleItem = (index: number) => {
        setParsedItems(prev => prev.map((item, i) =>
            i === index ? { ...item, selected: !item.selected } : item
        ));
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal import-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title flex items-center gap-2">
                        <Sparkles size={20} className="text-primary-500" />
                        Smart Import
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {step === 'input' ? (
                        <div className="import-input-step">
                            <p className="text-muted mb-4">
                                Paste your shopping list below. We'll use AI to organize it for you!
                            </p>
                            <textarea
                                className="input import-textarea"
                                placeholder="e.g. 2 milk, eggs, bread, chicken breast..."
                                value={rawText}
                                onChange={e => setRawText(e.target.value)}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div className="import-preview-step">
                            <p className="text-muted mb-4">
                                Review items before adding:
                            </p>
                            <div className="preview-list">
                                {parsedItems.map((item, index) => (
                                    <label key={index} className="preview-item">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => toggleItem(index)}
                                        />
                                        <span className="checkmark">
                                            {item.selected && <Check size={14} />}
                                        </span>
                                        <div className="flex-1">
                                            <span className="font-medium">{item.name}</span>
                                            {item.category && (
                                                <span className="text-xs text-muted ml-2 uppercase tracking-wide">
                                                    {item.category}
                                                </span>
                                            )}
                                        </div>
                                        {item.quantity > 1 && (
                                            <span className="badge badge-primary">x{item.quantity}</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {step === 'input' ? (
                        <button
                            className="btn btn-primary w-full"
                            onClick={handleParse}
                            disabled={!rawText.trim() || isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    Parsing...
                                </>
                            ) : (
                                <>
                                    Parse List
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="flex gap-3 w-full">
                            <button
                                className="btn btn-secondary flex-1"
                                onClick={() => setStep('input')}
                            >
                                Back
                            </button>
                            <button
                                className="btn btn-primary flex-1"
                                onClick={handleImport}
                                disabled={!parsedItems.some(i => i.selected)}
                            >
                                Import Selected
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
