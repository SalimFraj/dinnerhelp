import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader, Calendar, ShoppingCart, Lightbulb } from 'lucide-react';
import { generateWeeklyMealPlan, type GeneratedMealPlan } from '../../services/aiService';
import { usePantryStore, useUIStore } from '../../stores';
import './MealPlanGenerator.css';

interface MealPlanGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onApply?: (plan: GeneratedMealPlan) => void;
}

export default function MealPlanGenerator({ isOpen, onClose, onApply }: MealPlanGeneratorProps) {
    const [days, setDays] = useState(7);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<GeneratedMealPlan | null>(null);
    const { ingredients } = usePantryStore();
    const { addToast } = useUIStore();

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const plan = await generateWeeklyMealPlan(ingredients, { days });
            setResult(plan);
        } catch {
            addToast({ type: 'error', message: 'Failed to generate meal plan' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (result && onApply) {
            onApply(result);
        }
        onClose();
    };

    const handleClose = () => {
        setResult(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="meal-plan-modal"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="modal-header">
                            <div className="modal-title-row">
                                <div className="modal-icon">
                                    <Sparkles size={20} />
                                </div>
                                <h2>AI Meal Planner</h2>
                            </div>
                            <button className="modal-close" onClick={handleClose}>
                                <X size={20} />
                            </button>
                        </header>

                        <div className="modal-body">
                            {!result ? (
                                <div className="generator-setup">
                                    <p className="setup-description">
                                        Generate a personalized meal plan based on your pantry ingredients
                                    </p>

                                    <div className="setup-option">
                                        <label>Number of days</label>
                                        <div className="day-selector">
                                            {[3, 5, 7].map((d) => (
                                                <button
                                                    key={d}
                                                    className={`day-btn ${days === d ? 'active' : ''}`}
                                                    onClick={() => setDays(d)}
                                                >
                                                    {d} days
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pantry-preview">
                                        <span className="pantry-count">
                                            {ingredients.length} ingredients available
                                        </span>
                                    </div>

                                    <button
                                        className="btn btn-primary btn-lg generate-btn"
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader size={18} className="spinner" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                Generate Plan
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="generator-result">
                                    {/* Meal Plan Days */}
                                    <div className="result-section">
                                        <h3>
                                            <Calendar size={18} />
                                            Your Meal Plan
                                        </h3>
                                        <div className="meal-days">
                                            {result.days.map((day, index) => (
                                                <div key={index} className="meal-day">
                                                    <span className="day-label">{day.date}</span>
                                                    <div className="day-meals">
                                                        {day.breakfast && (
                                                            <span className="meal">🌅 {day.breakfast}</span>
                                                        )}
                                                        {day.lunch && (
                                                            <span className="meal">☀️ {day.lunch}</span>
                                                        )}
                                                        {day.dinner && (
                                                            <span className="meal">🌙 {day.dinner}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shopping List */}
                                    {result.shoppingList.length > 0 && (
                                        <div className="result-section">
                                            <h3>
                                                <ShoppingCart size={18} />
                                                Shopping List
                                            </h3>
                                            <div className="shopping-items">
                                                {result.shoppingList.map((item, index) => (
                                                    <span key={index} className="shopping-item">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tips */}
                                    {result.tips.length > 0 && (
                                        <div className="result-section">
                                            <h3>
                                                <Lightbulb size={18} />
                                                Tips
                                            </h3>
                                            <ul className="tips-list">
                                                {result.tips.map((tip, index) => (
                                                    <li key={index}>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="result-actions">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setResult(null)}
                                        >
                                            Generate Again
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleApply}
                                        >
                                            Apply to Calendar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
