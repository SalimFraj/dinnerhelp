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
    toggleFavorite: (id: string) => void;
    rateRecipe: (id: string, rating: number) => void;
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
                    let params;
                    if (exists) {
                        params = {
                            recipes: state.recipes.map((r) =>
                                r.id === recipe.id ? { ...r, ...recipe } : r
                            ),
                        };
                    } else {
                        params = { recipes: [...state.recipes, recipe] };
                    }

                    // Sync if it's a custom recipe
                    if (recipe.isCustom) {
                        const user = useAuthStore.getState().user;
                        if (user) {
                            const customRecipes = params.recipes.filter(r => r.isCustom);
                            syncRecipes(user.uid, customRecipes);
                        }
                    }
                    return params;
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

            toggleFavorite: (id) => {
                set((state) => {
                    const isFavorite = state.favorites.includes(id);
                    const recipe = state.recipes.find((r) => r.id === id);

                    const params = {
                        favorites: isFavorite
                            ? state.favorites.filter((fid) => fid !== id)
                            : [...state.favorites, id],
                        recipes: recipe
                            ? state.recipes.map((r) =>
                                r.id === id ? { ...r, isFavorite: !isFavorite } : r
                            )
                            : state.recipes,
                    };

                    const user = useAuthStore.getState().user;
                    if (user) syncFavorites(user.uid, params.favorites);

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

            getFavorites: () => {
                const state = get();
                return state.recipes.filter((r) => state.favorites.includes(r.id));
            },

            getCustomRecipes: () => {
                return get().recipes.filter((r) => r.isCustom);
            },

            searchRecipes: (query) => {
                const lowerQuery = query.toLowerCase();
                return get().recipes.filter(
                    (r) =>
                        r.title.toLowerCase().includes(lowerQuery) ||
                        r.category?.toLowerCase().includes(lowerQuery) ||
                        r.cuisine?.toLowerCase().includes(lowerQuery)
                );
            },
        }),
        {
            name: 'dinnerhelp-recipes',
        }
    )
);
