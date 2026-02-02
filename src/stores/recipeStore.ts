import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe } from '../types';
import { syncRecipes, syncFavorites } from '../services/syncService';
import { useAuthStore } from './authStore';

interface RecipeState {
    recipes: Recipe[];
    favorites: string[];
    addRecipe: (recipe: Recipe) => void;
    updateRecipe: (id: string, updates: Partial<Recipe>) => void;
    removeRecipe: (id: string) => void;
    deleteRecipe: (id: string) => void; // Alias for removeRecipe for clearer intent
    toggleFavorite: (id: string, recipe?: Recipe) => void;
    rateRecipe: (id: string, rating: number) => void;
    clearAll: () => void;
    getFavorites: () => Recipe[];
    getCustomRecipes: () => Recipe[];
    searchRecipes: (query: string) => Recipe[];
}

export const useRecipeStore = create<RecipeState>()(
    persist(
        (set, get) => ({
            recipes: [],
            favorites: [],

            addRecipe: (recipe) => {
                set((state) => {
                    const exists = state.recipes.some((r) => r.id === recipe.id);
                    let newRecipes;

                    if (exists) {
                        newRecipes = state.recipes.map((r) =>
                            r.id === recipe.id ? { ...r, ...recipe } : r
                        );
                    } else {
                        newRecipes = [...state.recipes, recipe];
                    }

                    // Sync if it's a custom recipe
                    if (recipe.isCustom) {
                        const user = useAuthStore.getState().user;
                        if (user) {
                            const customRecipes = newRecipes.filter(r => r.isCustom);
                            syncRecipes(user.uid, customRecipes);
                        }
                    }

                    return { recipes: newRecipes };
                });
            },

            updateRecipe: (id, updates) => {
                set((state) => {
                    const params = {
                        recipes: state.recipes.map((recipe) =>
                            recipe.id === id ? { ...recipe, ...updates } : recipe
                        )
                    };

                    // Only sync custom recipes
                    const updatedRecipe = params.recipes.find(r => r.id === id);
                    if (updatedRecipe?.isCustom) {
                        const user = useAuthStore.getState().user;
                        if (user) {
                            const customRecipes = params.recipes.filter(r => r.isCustom);
                            syncRecipes(user.uid, customRecipes);
                        }
                    }
                    return params;
                });
            },

            removeRecipe: (id) => {
                set((state) => {
                    const recipeToRemove = state.recipes.find(r => r.id === id);
                    const params = {
                        recipes: state.recipes.filter((r) => r.id !== id),
                        favorites: state.favorites.filter((fid) => fid !== id),
                    };

                    const user = useAuthStore.getState().user;
                    if (user) {
                        if (recipeToRemove?.isCustom) {
                            const customRecipes = params.recipes.filter(r => r.isCustom);
                            syncRecipes(user.uid, customRecipes);
                        }
                        // Also sync favorites removal
                        syncFavorites(user.uid, params.favorites);
                    }
                    return params;
                });
            },

            deleteRecipe: (id) => get().removeRecipe(id),

            toggleFavorite: (id, recipeObject) => {
                set((state) => {
                    const isFavorite = state.favorites.includes(id);
                    let currentRecipes = state.recipes;

                    // If we are favoriting and have the object, ensure it's in the store
                    if (!isFavorite && recipeObject) {
                        const exists = currentRecipes.some(r => r.id === id);
                        if (!exists) {
                            currentRecipes = [...currentRecipes, recipeObject];
                        }
                    }

                    const params = {
                        favorites: isFavorite
                            ? state.favorites.filter((fid) => fid !== id)
                            : [...state.favorites, id],
                        recipes: currentRecipes.map((r) =>
                            r.id === id ? { ...r, isFavorite: !isFavorite } : r
                        ),
                    };

                    const user = useAuthStore.getState().user;
                    if (user) {
                        syncFavorites(user.uid, params.favorites);
                        // If we added a new recipe (not custom), we probably don't need to sync it to 'recipes' collection 
                        // unless we want it to be a "custom" recipe. 
                        // But for now, local persistence is handled by persist middleware.
                        // However, if we want it to persist across devices, we rely on the fact that
                        // we generally only sync 'custom' recipes.
                        // If we want favorited API recipes to persist across devices, we need to fetch them by ID or store them?
                        // The current architecture seems to sync 'favorites' as a list of IDs.
                        // Clients need to be able to fetch those IDs. 
                        // Since they are external IDs, we might need to fetch them again?
                        // OR we should save them as custom recipes?
                        // Let's just update local state for now to fix the UI issue.
                    }

                    return params;
                });
            },

            rateRecipe: (id, rating) => {
                set((state) => ({
                    recipes: state.recipes.map((recipe) =>
                        recipe.id === id ? { ...recipe, rating } : recipe
                    ),
                }));
                // Ratings are local only for now unless custom recipe
            },

            clearAll: () => {
                set({ recipes: [], favorites: [] });
                const user = useAuthStore.getState().user;
                if (user) {
                    syncRecipes(user.uid, []);
                    syncFavorites(user.uid, []);
                }
            },

            getFavorites: () => {
                const state = get();
                return state.recipes.filter((r) => state.favorites.includes(r.id));
            },

            getCustomRecipes: () => {
                return get().recipes.filter((r) => r.isCustom);
            },

            searchRecipes: (query) => {
                const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
                return get().recipes.filter((r) => {
                    const searchableText = `${r.title} ${r.category || ''} ${r.cuisine || ''}`.toLowerCase();
                    return terms.every(term => searchableText.includes(term));
                });
            },
        }),
        {
            name: 'dinnerhelp-recipes',
        }
    )
);
