import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Plus,
    X,
    List,
    Grid
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useMealPlanStore, usePantryStore, useRecipeStore, useUIStore } from '../stores';
import { generateAISuggestions } from '../services/recipeService';
import type { MealType, Recipe } from '../types';
import './MealPlan.css';

const mealTypes: { type: MealType; emoji: string; label: string }[] = [
    { type: 'breakfast', emoji: '🌅', label: 'Breakfast' },
    { type: 'lunch', emoji: '☀️', label: 'Lunch' },
    { type: 'dinner', emoji: '🌙', label: 'Dinner' },
    { type: 'snack', emoji: '🍿', label: 'Snack' },
];

export default function MealPlan() {
    const navigate = useNavigate();
    const { mealPlans, removeMealPlan, addMealPlan } = useMealPlanStore();
    const { ingredients } = usePantryStore();
    const { recipes, addRecipe } = useRecipeStore();
    const { addToast } = useUIStore();

    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 0 })
    );
    const [viewMode, setViewMode] = useState<'simple' | 'calendar'>('simple');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showRecipePicker, setShowRecipePicker] = useState<{
        date: string;
        mealType: MealType;
    } | null>(null);

    // Get days of the week
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    // Get meals for the current week
    const weekMeals = useMemo(() => {
        const meals: Record<string, Record<MealType, (typeof mealPlans)[0] | undefined>> = {};

        weekDays.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            meals[dateKey] = {
                breakfast: undefined,
                lunch: undefined,
                dinner: undefined,
                snack: undefined,
            };

            mealPlans.forEach(plan => {
                if (plan.date === dateKey) {
                    meals[dateKey][plan.mealType] = plan;
                }
            });
        });

        return meals;
    }, [weekDays, mealPlans]);

    const navigateWeek = (direction: -1 | 1) => {
        setCurrentWeekStart(prev => addDays(prev, direction * 7));
    };

    const handleGenerateSuggestions = async () => {
        if (ingredients.length === 0) {
            addToast({ type: 'warning', message: 'Add ingredients to your pantry first!' });
            return;
        }

        setIsGenerating(true);
        try {
            const ingredientNames = ingredients.map(i => i.name);
            const suggestions = await generateAISuggestions(ingredientNames);

            // Add suggestions to recipes
            suggestions.forEach(recipe => {
                addRecipe(recipe);
            });

            // Auto-fill some meals for the week
            const today = new Date();
            const mealTypesToFill: MealType[] = ['lunch', 'dinner'];
            let suggestionIndex = 0;

            for (let i = 0; i < 3 && suggestionIndex < suggestions.length; i++) {
                const day = addDays(today, i);
                const dateKey = format(day, 'yyyy-MM-dd');

                for (const mealType of mealTypesToFill) {
                    if (suggestionIndex >= suggestions.length) break;

                    // Check if slot is empty
                    if (!weekMeals[dateKey]?.[mealType]) {
                        addMealPlan({
                            date: dateKey,
                            mealType,
                            recipeId: suggestions[suggestionIndex].id,
                            recipe: suggestions[suggestionIndex],
                        });
                        suggestionIndex++;
                    }
                }
            }

            addToast({ type: 'success', message: 'Generated meal suggestions!' });
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to generate suggestions. Check API key.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddMeal = (recipe: Recipe) => {
        if (!showRecipePicker) return;

        addMealPlan({
            date: showRecipePicker.date,
            mealType: showRecipePicker.mealType,
            recipeId: recipe.id,
            recipe,
        });

        setShowRecipePicker(null);
        addToast({ type: 'success', message: `Added ${recipe.title}` });
    };

    const handleRecipeClick = (recipeId: string) => {
        navigate(`/recipes/${recipeId}`);
    };

    const today = new Date();

    return (
        <div className="page meal-plan-page">
            <header className="page-header">
                <h1 className="page-title">Meal Plan</h1>
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'simple' ? 'active' : ''}`}
                        onClick={() => setViewMode('simple')}
                    >
                        <List size={18} />
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                        onClick={() => setViewMode('calendar')}
                    >
                        <Grid size={18} />
                    </button>
                </div>
            </header>

            {/* AI Suggestion */}
            <button
                className="ai-generate-btn"
                onClick={handleGenerateSuggestions}
                disabled={isGenerating}
            >
                <Sparkles size={20} className={isGenerating ? 'animate-spin' : ''} />
                <span>{isGenerating ? 'Generating...' : 'Generate Week Plan'}</span>
            </button>

            {/* Week Navigation */}
            <div className="week-nav">
                <button className="nav-btn" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft size={20} />
                </button>
                <span className="week-label">
                    {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                </span>
                <button className="nav-btn" onClick={() => navigateWeek(1)}>
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Simple View */}
            {viewMode === 'simple' && (
                <div className="simple-view">
                    {weekDays.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayMeals = weekMeals[dateKey];
                        const isToday = isSameDay(day, today);

                        return (
                            <motion.div
                                key={dateKey}
                                className={`day-card ${isToday ? 'today' : ''}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="day-header">
                                    <span className="day-name">{format(day, 'EEEE')}</span>
                                    <span className="day-date">{format(day, 'MMM d')}</span>
                                    {isToday && <span className="today-badge">Today</span>}
                                </div>

                                <div className="day-meals">
                                    {mealTypes.map(({ type, emoji, label }) => {
                                        const meal = dayMeals[type];

                                        return (
                                            <div key={type} className="meal-slot">
                                                <span className="meal-label">{emoji} {label}</span>
                                                {meal ? (
                                                    <div className="meal-content">
                                                        <span
                                                            className="meal-title clickable"
                                                            onClick={() => meal.recipe && handleRecipeClick(meal.recipe.id)}
                                                        >
                                                            {meal.recipe?.title || 'Recipe'}
                                                        </span>
                                                        <button
                                                            className="meal-remove"
                                                            onClick={() => removeMealPlan(meal.id)}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="add-meal-btn"
                                                        onClick={() => setShowRecipePicker({ date: dateKey, mealType: type })}
                                                    >
                                                        <Plus size={14} />
                                                        Add
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <div className="calendar-view">
                    {/* Header Row */}
                    <div className="calendar-header">
                        <div className="calendar-cell header-cell" />
                        {weekDays.map(day => (
                            <div
                                key={format(day, 'yyyy-MM-dd')}
                                className={`calendar-cell header-cell ${isSameDay(day, today) ? 'today' : ''}`}
                            >
                                <span className="header-day">{format(day, 'EEE')}</span>
                                <span className="header-date">{format(day, 'd')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Meal Rows */}
                    {mealTypes.slice(0, 3).map(({ type, emoji, label }) => (
                        <div key={type} className="calendar-row">
                            <div className="calendar-cell row-label">
                                <span>{emoji}</span>
                                <span>{label}</span>
                            </div>
                            {weekDays.map(day => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const meal = weekMeals[dateKey]?.[type];

                                return (
                                    <div
                                        key={dateKey}
                                        className={`calendar-cell meal-cell ${meal ? 'has-meal' : ''}`}
                                        onClick={() => !meal && setShowRecipePicker({ date: dateKey, mealType: type })}
                                    >
                                        {meal ? (
                                            <div
                                                className="cell-meal clickable"
                                                onClick={() => meal.recipe && handleRecipeClick(meal.recipe.id)}
                                            >
                                                <span className="cell-meal-title">{meal.recipe?.title}</span>
                                                <button
                                                    className="cell-remove"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeMealPlan(meal.id);
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <Plus size={14} className="cell-add-icon" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Recipe Picker Modal */}
            {showRecipePicker && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowRecipePicker(null)}
                >
                    <motion.div
                        className="modal recipe-picker-modal"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">Choose Recipe</h2>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => setShowRecipePicker(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body picker-list">
                            {recipes.length === 0 ? (
                                <p className="no-recipes">No recipes available. Add some from the Recipes page!</p>
                            ) : (
                                recipes.slice(0, 20).map(recipe => (
                                    <button
                                        key={recipe.id}
                                        className="picker-item"
                                        onClick={() => handleAddMeal(recipe)}
                                    >
                                        {recipe.image && (
                                            <img src={recipe.image} alt="" className="picker-image" />
                                        )}
                                        <div className="picker-info">
                                            <span className="picker-title">{recipe.title}</span>
                                            <span className="picker-meta">{recipe.cookTime} min · {recipe.difficulty}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
