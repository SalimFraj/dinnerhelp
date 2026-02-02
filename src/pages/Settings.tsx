import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Trash2,
    AlertTriangle,
    ShoppingBasket,
    ChefHat,
    Calendar,
    List
} from 'lucide-react';
import { usePantryStore } from '../stores/pantryStore';
import { useShoppingStore } from '../stores/shoppingStore';
import { useMealPlanStore } from '../stores/mealPlanStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useUIStore } from '../stores';
import './Settings.css';

export default function Settings() {
    const navigate = useNavigate();
    const { addToast } = useUIStore();
    const { clearPantry } = usePantryStore();
    const { clearAllItems, activeListId } = useShoppingStore();
    const { clearAll: clearMealPlans } = useMealPlanStore();
    const { clearAll: clearRecipes } = useRecipeStore();

    // Confirm Modal State
    const [confirmAction, setConfirmAction] = useState<{
        type: 'pantry' | 'recipes' | 'shopping' | 'mealplan';
        title: string;
        message: string;
    } | null>(null);

    const handleClear = () => {
        if (!confirmAction) return;

        switch (confirmAction.type) {
            case 'pantry':
                clearPantry();
                addToast({ type: 'success', message: 'Pantry cleared successfully' });
                break;
            case 'recipes':
                clearRecipes();
                addToast({ type: 'success', message: 'All recipes and favorites cleared' });
                break;
            case 'shopping':
                if (activeListId) {
                    clearAllItems(activeListId);
                    addToast({ type: 'success', message: 'Shopping list cleared' });
                } else {
                    addToast({ type: 'error', message: 'No active shopping list' });
                }
                break;
            case 'mealplan':
                clearMealPlans();
                addToast({ type: 'success', message: 'Meal plan cleared' });
                break;
        }
        setConfirmAction(null);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="page settings-page">
            <header className="page-header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="page-title">Settings</h1>
            </header>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="settings-content"
            >
                <motion.section variants={item} className="settings-section danger-zone">
                    <div className="section-header">
                        <AlertTriangle size={20} className="text-error" />
                        <h2>Danger Zone</h2>
                    </div>
                    <p className="section-desc">These actions cannot be undone.</p>

                    <div className="settings-actions">
                        <button
                            className="settings-btn danger"
                            onClick={() => setConfirmAction({
                                type: 'pantry',
                                title: 'Clear Pantry',
                                message: 'Are you sure you want to delete ALL items from your pantry? This cannot be undone.'
                            })}
                        >
                            <div className="btn-icon-wrapper">
                                <ShoppingBasket size={20} />
                            </div>
                            <div className="btn-text">
                                <span className="btn-title">Clear Pantry</span>
                                <span className="btn-subtitle">Remove all ingredients</span>
                            </div>
                            <Trash2 size={18} />
                        </button>

                        <button
                            className="settings-btn danger"
                            onClick={() => setConfirmAction({
                                type: 'recipes',
                                title: 'Clear My Recipes',
                                message: 'Are you sure you want to delete all custom recipes and favorites?'
                            })}
                        >
                            <div className="btn-icon-wrapper">
                                <ChefHat size={20} />
                            </div>
                            <div className="btn-text">
                                <span className="btn-title">Clear My Recipes</span>
                                <span className="btn-subtitle">Delete custom recipes & favorites</span>
                            </div>
                            <Trash2 size={18} />
                        </button>

                        <button
                            className="settings-btn danger"
                            onClick={() => setConfirmAction({
                                type: 'shopping',
                                title: 'Clear Shopping List',
                                message: 'Are you sure you want to remove all items from your current shopping list?'
                            })}
                        >
                            <div className="btn-icon-wrapper">
                                <List size={20} />
                            </div>
                            <div className="btn-text">
                                <span className="btn-title">Clear Shopping List</span>
                                <span className="btn-subtitle">Empty current list</span>
                            </div>
                            <Trash2 size={18} />
                        </button>

                        <button
                            className="settings-btn danger"
                            onClick={() => setConfirmAction({
                                type: 'mealplan',
                                title: 'Clear Meal Plan',
                                message: 'Are you sure you want to delete your entire meal plan history?'
                            })}
                        >
                            <div className="btn-icon-wrapper">
                                <Calendar size={20} />
                            </div>
                            <div className="btn-text">
                                <span className="btn-title">Clear Meal Plan</span>
                                <span className="btn-subtitle">Reset all scheduled meals</span>
                            </div>
                            <Trash2 size={18} />
                        </button>
                    </div>
                </motion.section>
            </motion.div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="modal-overlay">
                    <motion.div
                        className="modal-content confirm-modal"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="modal-header">
                            <AlertTriangle size={24} className="text-error" />
                            <h3>{confirmAction.title}</h3>
                        </div>
                        <p>{confirmAction.message}</p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setConfirmAction(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleClear}
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
