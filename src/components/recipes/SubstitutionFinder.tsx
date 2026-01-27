import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronRight, Loader, AlertCircle } from 'lucide-react';
import { getIngredientSubstitutions, type SubstitutionResult } from '../../services/aiService';
import { usePantryStore } from '../../stores';
import './SubstitutionFinder.css';

interface SubstitutionFinderProps {
    ingredient: string;
    onSelect?: (substitute: string) => void;
}

export default function SubstitutionFinder({ ingredient, onSelect }: SubstitutionFinderProps) {
    const [result, setResult] = useState<SubstitutionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const { ingredients } = usePantryStore();

    const findSubstitutes = async () => {
        if (result) {
            setIsOpen(!isOpen);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const substitutes = await getIngredientSubstitutions(ingredient, ingredients);
            setResult(substitutes);
            setIsOpen(true);
        } catch {
            setError('Failed to find substitutes');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="substitution-finder">
            <button
                className="substitution-trigger"
                onClick={findSubstitutes}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader size={16} className="spinner" />
                ) : (
                    <RefreshCw size={16} />
                )}
                <span>Find substitutes</span>
                {result && (
                    <ChevronRight
                        size={16}
                        className={`chevron ${isOpen ? 'open' : ''}`}
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && result && (
                    <motion.div
                        className="substitution-list"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {result.substitutes.map((sub, index) => (
                            <motion.button
                                key={index}
                                className="substitution-item"
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelect?.(sub.name)}
                            >
                                <div className="substitution-main">
                                    <span className="substitution-name">{sub.name}</span>
                                    <span className="substitution-ratio">{sub.ratio}</span>
                                </div>
                                <span className="substitution-notes">{sub.notes}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="substitution-error">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
