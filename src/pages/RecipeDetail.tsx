import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    Sparkles
} from 'lucide-react';
import { useRecipeStore, usePantryStore, useShoppingStore, useUIStore } from '../stores';
import type { Recipe } from '../types';
import { detectIngredientCategory } from '../services/categorizationService';
import './RecipeDetail.css';

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { recipes, toggleFavorite, favorites, rateRecipe, addRecipe } = useRecipeStore();
    const { ingredients } = usePantryStore();
    const { createList, addItem, getActiveList } = useShoppingStore();
    const { addToast } = useUIStore();

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        const found = recipes.find(r => r.id === id);
        if (found) {
            setRecipe(found);
            setIsPreview(false);
        } else if (location.state?.recipe) {
            // Fallback to preview data passed via navigation
            setRecipe(location.state.recipe);
            setIsPreview(true);
        }
    }, [id, recipes, location.state]);

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

        // Map ingredient categories to shopping categories
        const categoryMap: Record<string, 'produce' | 'meat' | 'dairy' | 'bakery' | 'frozen' | 'pantry' | 'beverages' | 'household' | 'other'> = {
            produce: 'produce',
            meat: 'meat',
            dairy: 'dairy',
            grains: 'pantry',
            canned: 'pantry',
            frozen: 'frozen',
            spices: 'pantry',
            condiments: 'pantry',
            beverages: 'beverages',
            snacks: 'pantry',
            other: 'other'
        };

        missingIngredients.forEach(ing => {
            const ingredientCat = detectIngredientCategory(ing.name);
            const shoppingCat = categoryMap[ingredientCat] || 'other';
            addItem(listId!, {
                name: ing.name,
                category: shoppingCat,
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

    const handleRate = (rating: number) => {
        rateRecipe(recipe.id, rating);
        addToast({ type: 'success', message: 'Rating saved!' });
    };

    const handleSaveCopy = () => {
        const newId = `custom-${Date.now()}`;
        const newRecipe = {
            ...recipe,
            id: newId,
            title: `${recipe.title} (My Version)`,
            isCustom: true,
            source: 'custom' as const,
            sourceId: recipe.id,
            isFavorite: false, // Reset rating/favorite for the copy
            rating: 0,
        };

        // Add to store (this will sync if user is logged in)
        useRecipeStore.getState().addRecipe(newRecipe);

        addToast({ type: 'success', message: 'Recipe cloned to My Recipes!' });
        navigate(`/recipes/${newId}`);
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
                    {isPreview ? (
                        <button
                            className="btn btn-primary action-btn"
                            onClick={() => {
                                if (recipe) {
                                    addRecipe({ ...recipe, isCustom: true, source: 'ai' as const });
                                    addToast({ type: 'success', message: 'Recipe saved to collection!' });
                                    setIsPreview(false);
                                }
                            }}
                        >
                            <Sparkles size={18} />
                            Save to Collection
                        </button>
                    ) : (
                        <>
                            {/* Cook Button */}
                            <button
                                className="btn btn-primary action-btn"
                                onClick={() => {
                                    if (window.confirm('Mark this meal as cooked? Ingredients will be deducted from your pantry.')) {
                                        // Dynamic Import to avoid cycle in some architectures, though direct import is usually fine here
                                        // importing at top level is better. Assume actionService is imported? 
                                        // Need to import it at top of file first.
                                        import('../services/actionService').then(({ actionService }) => {
                                            const deducted = actionService.cookRecipe(recipe.ingredients);
                                            addToast({ type: 'success', message: `Bon Appétit! Updated ${deducted} pantry items.` });
                                        });
                                    }
                                }}
                            >
                                <Check size={18} />
                                Mark as Cooked
                            </button>

                            {missingIngredients.length > 0 && (
                                <button className="btn btn-secondary action-btn" onClick={handleAddToShoppingList}>
                                    <ShoppingCart size={18} />
                                    Add {missingIngredients.length} to List
                                </button>
                            )}
                            <button
                                className="btn btn-secondary action-btn"
                                onClick={() => navigate('/meal-plan', { state: { selectedRecipe: recipe } })}
                            >
                                <Calendar size={18} />
                                Plan
                            </button>
                            {!recipe.isCustom && (
                                <button
                                    className="btn btn-secondary action-btn"
                                    onClick={handleSaveCopy}
                                >
                                    <Sparkles size={18} />
                                    Save Copy
                                </button>
                            )}
                        </>
                    )}
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

        </div>
    );
}
