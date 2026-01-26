import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Heart, Sparkles, Check } from 'lucide-react';
import { useRecipeStore } from '../../stores';
import type { Recipe } from '../../types';
import './RecipeCard.css';

interface Props {
    recipe: Recipe;
    matchCount?: number;
}

export default function RecipeCard({ recipe, matchCount = 0 }: Props) {
    const { toggleFavorite, favorites } = useRecipeStore();
    const isFavorite = favorites.includes(recipe.id);

    const handleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(recipe.id);
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
                    {matchCount > 0 && (
                        <span className="match-badge">
                            <Check size={12} />
                            {matchCount} match{matchCount > 1 ? 'es' : ''}
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
