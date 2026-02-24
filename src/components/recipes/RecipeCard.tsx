import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Heart, Sparkles, AlertCircle, Check } from 'lucide-react';
import { useRecipeStore } from '../../stores';
import type { Recipe } from '../../types';
import './RecipeCard.css';

import { Trash2 } from 'lucide-react'; // Import Trash2

interface Props {
    recipe: Recipe;
    missingCount?: number;
    onDelete?: (id: string) => void;
}

export default function RecipeCard({ recipe, missingCount = 0, onDelete }: Props) {
    const { toggleFavorite, favorites } = useRecipeStore();
    const isFavorite = favorites.includes(recipe.id);

    const handleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(recipe.id, recipe);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) onDelete(recipe.id);
    };

    return (
        <Link to={`/recipes/${recipe.id}`} className="recipe-card-link">
            <motion.article
                className="recipe-card"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Image */}
                <div className="recipe-card-image">
                    {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} loading="lazy" />
                    ) : (
                        <div className="recipe-card-placeholder">
                            {recipe.source === 'ai' ? <Sparkles size={32} /> : '🍽️'}
                        </div>
                    )}

                    {/* Delete Custom Recipe Button - Show only if onDelete provided */}
                    {onDelete && (
                        <button
                            className="delete-recipe-btn"
                            onClick={handleDelete}
                            aria-label="Delete recipe"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}

                    {/* Favorite Button */}
                    <button
                        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                        onClick={handleFavorite}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    {/* AI Badge */}
                    {recipe.source === 'ai' && (
                        <span className="ai-badge">
                            <Sparkles size={12} />
                            AI
                        </span>
                    )}

                    {/* Match indicator */}
                    {missingCount === 0 ? (
                        <span className="match-badge ready">
                            <Check size={12} />
                            Ready to cook!
                        </span>
                    ) : missingCount > 0 && (
                        <span className="match-badge missing">
                            <AlertCircle size={12} />
                            {missingCount} missing
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="recipe-card-content">
                    <h3 className="recipe-card-title">{recipe.title}</h3>

                    <div className="recipe-card-meta">
                        <span className="meta-item">
                            <Clock size={14} />
                            {recipe.cookTime}m
                        </span>
                        <span className="meta-item">
                            <Users size={14} />
                            {recipe.servings}
                        </span>
                        <span className={`difficulty-badge ${recipe.difficulty}`}>
                            {recipe.difficulty}
                        </span>
                    </div>

                    {recipe.category && (
                        <span className="recipe-category">{recipe.category}</span>
                    )}
                </div>
            </motion.article>
        </Link>
    );
}
