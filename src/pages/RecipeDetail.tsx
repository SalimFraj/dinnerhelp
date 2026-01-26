import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    Users,
    Heart,
    Star,
    ShoppingCart,
    Calendar,
    Check,
    X,
    Sparkles
} from 'lucide-react';
import { useRecipeStore, usePantryStore, useShoppingStore, useMealPlanStore, useUIStore } from '../stores';
import type { Recipe, MealType } from '../types';
import './RecipeDetail.css';

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { recipes, toggleFavorite, favorites, rateRecipe } = useRecipeStore();
    const { ingredients } = usePantryStore();
    const { createList, addItem, getActiveList } = useShoppingStore();
    const { addMealPlan } = useMealPlanStore();
    const { addToast } = useUIStore();

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [showMealPlanModal, setShowMealPlanModal] = useState(false);

    useEffect(() => {
        const found = recipes.find(r => r.id === id);
        if (found) {
            setRecipe(found);
        }
    }, [id, recipes]);

    if (!recipe) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h3>Recipe not found</h3>
                    <button className="btn btn-secondary" onClick={() => navigate('/recipes')}>
                        Back to Recipes
                    </button>
                </div>
            </div>
        );
    }

    const isFavorite = favorites.includes(recipe.id);

    // Check which ingredients we have
    const pantryNames = ingredients.map(i => i.name.toLowerCase());
    const ingredientStatus = recipe.ingredients.map(ri => ({
        ...ri,
        inPantry: pantryNames.some(pn =>
            ri.name.toLowerCase().includes(pn) || pn.includes(ri.name.toLowerCase())
        ),
    }));

    const missingIngredients = ingredientStatus.filter(i => !i.inPantry);

    const handleAddToShoppingList = () => {
        let listId = getActiveList()?.id;
        if (!listId) {
            listId = createList('Shopping List');
        }

        missingIngredients.forEach(ing => {
            addItem(listId!, {
                name: ing.name,
                category: 'other',
                quantity: 1,
                unit: ing.quantity || 'unit',
                checked: false,
            });
        });

        addToast({
            type: 'success',
            message: `Added ${missingIngredients.length} items to shopping list`
        });
    };

    const handleAddToMealPlan = (mealType: MealType) => {
        const today = new Date().toISOString().split('T')[0];
        addMealPlan({
            date: today,
            mealType,
            recipeId: recipe.id,
            recipe,
        });
        setShowMealPlanModal(false);
        addToast({ type: 'success', message: `Added to ${mealType}` });
    };

    const handleRate = (rating: number) => {
        rateRecipe(recipe.id, rating);
        addToast({ type: 'success', message: 'Rating saved!' });
    };

    return (
        <div className="recipe-detail-page">
            {/* Header Image */}
            <div className="recipe-hero">
                {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="hero-image" />
                ) : (
                    <div className="hero-placeholder">
                        {recipe.source === 'ai' ? <Sparkles size={48} /> : '🍽️'}
                    </div>
                )}
                <div className="hero-overlay" />

                {/* Back Button */}
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>

                {/* Favorite Button */}
                <button
                    className={`hero-favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={() => toggleFavorite(recipe.id)}
                >
                    <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>

                {/* AI Badge */}
                {recipe.source === 'ai' && (
                    <span className="hero-ai-badge">
                        <Sparkles size={14} />
                        AI Generated
                    </span>
                )}
            </div>

            {/* Content */}
            <motion.div
                className="recipe-content"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                {/* Title */}
                <h1 className="recipe-title">{recipe.title}</h1>

                {/* Meta */}
                <div className="recipe-meta">
                    <div className="meta-item">
                        <Clock size={18} />
                        <span>{recipe.cookTime} min</span>
                    </div>
                    <div className="meta-item">
                        <Users size={18} />
                        <span>{recipe.servings} servings</span>
                    </div>
                    <span className={`difficulty-pill ${recipe.difficulty}`}>
                        {recipe.difficulty}
                    </span>
                </div>

                {/* Rating */}
                <div className="rating-section">
                    <span className="rating-label">Rate this recipe:</span>
                    <div className="stars">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                className={`star-btn ${recipe.rating >= star ? 'active' : ''}`}
                                onClick={() => handleRate(star)}
                            >
                                <Star size={24} fill={recipe.rating >= star ? 'currentColor' : 'none'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="recipe-actions">
                    {missingIngredients.length > 0 && (
                        <button className="btn btn-secondary action-btn" onClick={handleAddToShoppingList}>
                            <ShoppingCart size={18} />
                            Add {missingIngredients.length} to List
                        </button>
                    )}
                    <button
                        className="btn btn-primary action-btn"
                        onClick={() => setShowMealPlanModal(true)}
                    >
                        <Calendar size={18} />
                        Add to Plan
                    </button>
                </div>

                {/* Description */}
                {recipe.description && (
                    <section className="recipe-section">
                        <p className="recipe-description">{recipe.description}</p>
                    </section>
                )}

                {/* Ingredients */}
                <section className="recipe-section">
                    <h2 className="section-title">Ingredients</h2>
                    <ul className="ingredients-list">
                        {ingredientStatus.map((ing, idx) => (
                            <li
                                key={idx}
                                className={`ingredient-item ${ing.inPantry ? 'in-pantry' : ''}`}
                            >
                                <span className="ingredient-check">
                                    {ing.inPantry ? <Check size={16} /> : null}
                                </span>
                                <span className="ingredient-qty">{ing.quantity}</span>
                                <span className="ingredient-name">{ing.name}</span>
                                {ing.inPantry && (
                                    <span className="pantry-badge">In pantry</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Instructions */}
                <section className="recipe-section">
                    <h2 className="section-title">Instructions</h2>
                    <ol className="instructions-list">
                        {recipe.instructions.map((step, idx) => (
                            <li key={idx} className="instruction-item">
                                <span className="step-number">{idx + 1}</span>
                                <p className="step-text">{step}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Source info */}
                {recipe.cuisine && (
                    <div className="recipe-tags">
                        {recipe.category && <span className="tag">{recipe.category}</span>}
                        {recipe.cuisine && <span className="tag">{recipe.cuisine}</span>}
                    </div>
                )}
            </motion.div>

            {/* Meal Plan Modal */}
            {showMealPlanModal && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMealPlanModal(false)}
                >
                    <motion.div
                        className="modal meal-plan-modal"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">Add to Meal Plan</h2>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => setShowMealPlanModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body meal-type-buttons">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                                <button
                                    key={type}
                                    className="meal-type-btn"
                                    onClick={() => handleAddToMealPlan(type)}
                                >
                                    {type === 'breakfast' && '🌅'}
                                    {type === 'lunch' && '☀️'}
                                    {type === 'dinner' && '🌙'}
                                    {type === 'snack' && '🍿'}
                                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
