import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Sparkles,
    Filter,
    ChefHat,
    Heart,
    Star,
    Loader,
    RefreshCw
} from 'lucide-react';
import { usePantryStore, useRecipeStore, useUIStore } from '../stores';
import { fetchRecipes, generateAISuggestions, searchRecipes } from '../services/recipeService';
import type { Recipe, DifficultyLevel } from '../types';
import RecipeCard from '../components/recipes/RecipeCard';
import FilterModal from '../components/recipes/FilterModal';
import './Recipes.css';

export default function Recipes() {
    const { ingredients } = usePantryStore();
    const { addRecipe, favorites, recipes: savedRecipes } = useRecipeStore();
    const { addToast } = useUIStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'discover' | 'favorites' | 'custom'>(
        (location.state as any)?.activeTab || 'discover'
    );

    // Filters
    const [filters, setFilters] = useState({
        maxCookTime: 120,
        difficulty: '' as DifficultyLevel | '',
        minServings: 1,
        maxServings: 10,
    });

    // Load recipes on mount if store is empty
    useEffect(() => {
        const discoverRecipes = savedRecipes.filter(r => !r.isCustom && r.source !== 'ai');
        if (discoverRecipes.length === 0) {
            loadRecipes();
        }
    }, []);

    const loadRecipes = async () => {
        setIsLoading(true);
        try {
            const fetched = await fetchRecipes(40);
            // Add all to store, they will persist
            fetched.forEach(r => addRecipe(r));
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load recipes' });
        } finally {
            setIsLoading(false);
        }
    };

    // Live Search
    useEffect(() => {
        const performSearch = async () => {
            if (activeTab !== 'discover' || !searchQuery || searchQuery.length < 3) return;

            setIsLoading(true);
            try {
                const results = await searchRecipes(searchQuery);
                if (results && results.length > 0) {
                    results.forEach(r => addRecipe(r));
                }
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, activeTab, addRecipe]);

    const getAISuggestions = async () => {
        if (ingredients.length === 0) {
            addToast({ type: 'warning', message: 'Add ingredients to your pantry first!' });
            return;
        }

        setIsAILoading(true);
        try {
            const ingredientNames = ingredients.map(i => i.name);
            // Request 3 suggestions for quick view
            const suggestions = await generateAISuggestions(ingredientNames, [], 3);

            // Add AI recipes to the list
            suggestions.forEach(recipe => {
                addRecipe(recipe);
            });

            addToast({ type: 'success', message: `Generated ${suggestions.length} recipe suggestions!` });
        } catch (error) {
            addToast({ type: 'error', message: 'AI suggestions require setup. Check your API key.' });
        } finally {
            setIsAILoading(false);
        }
    };

    // Calculate ingredient matches
    const getMatchCount = (recipe: Recipe) => {
        const pantryNames = ingredients.map(i => i.name.toLowerCase());
        return recipe.ingredients.filter(ri =>
            pantryNames.some(pn => ri.name.toLowerCase().includes(pn) || pn.includes(ri.name.toLowerCase()))
        ).length;
    };

    // Filter, search, and sort recipes
    const filteredRecipes = useMemo(() => {
        let result: Recipe[] = [];

        switch (activeTab) {
            case 'favorites':
                result = savedRecipes.filter(r => favorites.includes(r.id));
                break;
            case 'custom':
                result = savedRecipes.filter(r => r.isCustom);
                break;
            default:
                // Discover: Show everything that isn't custom, or just everything sorted by match count
                // Usually discover is for non-custom recipes
                result = savedRecipes.filter(r => !r.isCustom);
        }

        // Apply search
        if (searchQuery) {
            const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            result = result.filter(r => {
                const searchableText = `${r.title} ${r.category || ''} ${r.cuisine || ''}`.toLowerCase();
                return terms.every(term => searchableText.includes(term));
            });
        }

        // Apply filters
        if (filters.difficulty) {
            result = result.filter(r => r.difficulty === filters.difficulty);
        }
        if (filters.maxCookTime < 120) {
            result = result.filter(r => r.cookTime <= filters.maxCookTime);
        }
        if (filters.minServings > 1 || filters.maxServings < 10) {
            result = result.filter(r =>
                r.servings >= filters.minServings && r.servings <= filters.maxServings
            );
        }

        // Sort by match count (highest first) for Discover tab
        if (activeTab === 'discover') {
            result.sort((a, b) => getMatchCount(b) - getMatchCount(a));
        }

        return result;
    }, [savedRecipes, favorites, activeTab, searchQuery, filters, ingredients]);

    // Pagination
    const [visibleCount, setVisibleCount] = useState(20);
    const displayedRecipes = filteredRecipes.slice(0, visibleCount);
    const hasMore = visibleCount < filteredRecipes.length;

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(20);
    }, [activeTab, searchQuery, filters]);

    return (
        <div className="page recipes-page">
            <header className="page-header">
                <h1 className="page-title">Recipes</h1>
            </header>

            {/* AI Suggestion Button */}
            <button
                className="ai-suggest-btn"
                onClick={getAISuggestions}
                disabled={isAILoading}
            >
                {isAILoading ? (
                    <Loader size={20} className="spinner" />
                ) : (
                    <Sparkles size={20} />
                )}
                <div className="ai-suggest-content">
                    <span className="ai-suggest-title">
                        {isAILoading ? 'Generating...' : 'Get AI Suggestions'}
                    </span>
                    <span className="ai-suggest-subtitle">
                        Based on your {ingredients.length} pantry items
                    </span>
                </div>
            </button>

            {/* Search and Filter */}
            <div className="recipes-controls">
                <div className="input-with-icon search-input">
                    <Search size={20} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search recipes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    className={`btn btn-secondary btn-icon filter-btn ${Object.values(filters).some(v => v) ? 'has-filters' : ''}`}
                    onClick={() => setShowFilters(true)}
                >
                    <Filter size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="recipe-tabs">
                <button
                    className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discover')}
                >
                    <ChefHat size={16} />
                    Discover
                </button>
                <button
                    className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('favorites')}
                >
                    <Heart size={16} />
                    Favorites
                </button>
                <button
                    className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
                    onClick={() => setActiveTab('custom')}
                >
                    <Star size={16} />
                    My Recipes
                </button>
            </div>

            {/* Recipe Grid */}
            <div className="recipes-grid">
                {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="recipe-skeleton">
                            <div className="skeleton skeleton-image" />
                            <div className="skeleton-content">
                                <div className="skeleton skeleton-title" />
                                <div className="skeleton skeleton-meta" />
                            </div>
                        </div>
                    ))
                ) : displayedRecipes.length === 0 ? (
                    <div className="empty-state">
                        <ChefHat size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">
                            {activeTab === 'favorites'
                                ? 'No favorites yet'
                                : activeTab === 'custom'
                                    ? 'No custom recipes'
                                    : 'No recipes found'}
                        </h3>
                        <p className="empty-state-text">
                            {activeTab === 'favorites'
                                ? 'Heart recipes you love to see them here'
                                : activeTab === 'custom'
                                    ? 'Add your own recipes to build your collection'
                                    : searchQuery.length > 0 && searchQuery.length < 3
                                        ? 'Keep typing to search...'
                                        : 'Try adjusting your search or filters'}
                        </p>
                        {activeTab === 'discover' && (
                            <button className="btn btn-secondary" onClick={loadRecipes}>
                                <RefreshCw size={18} />
                                refresh
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <AnimatePresence mode="popLayout">
                            {displayedRecipes.map((recipe, index) => (
                                <motion.div
                                    key={recipe.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <RecipeCard
                                        recipe={recipe}
                                        matchCount={getMatchCount(recipe)}
                                        onDelete={activeTab === 'custom' ? (id) => {
                                            // Handle delete
                                            if (window.confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
                                                // Assuming we can just remove it from store.
                                                // We need to import removeRecipe from useRecipeStore or add it there if missing.
                                                // Let's check useRecipeStore in the component above.
                                                // It currently exposes: addRecipe, favorites, recipes. 
                                                // We might need to add removeRecipe to the destructuring.
                                                useRecipeStore.getState().deleteRecipe(id); // Accessing directly to avoid re-render if not destructured
                                                addToast({ type: 'success', message: 'Recipe deleted' });
                                            }
                                        } : undefined}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {hasMore && (
                            <div className="load-more-container">
                                <button className="btn btn-secondary load-more-btn" onClick={handleShowMore}>
                                    Show More
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Filter Modal */}
            <AnimatePresence>
                {showFilters && (
                    <FilterModal
                        filters={filters}
                        onChange={setFilters}
                        onClose={() => setShowFilters(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
