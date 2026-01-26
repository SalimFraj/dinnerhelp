import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe } from '../types';

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
                    if (exists) {
                        return {
                            recipes: state.recipes.map((r) =>
                                r.id === recipe.id ? { ...r, ...recipe } : r
                            ),
                        };
                    }
                    return { recipes: [...state.recipes, recipe] };
                });
            },

            updateRecipe: (id, updates) => {
                set((state) => ({
                    recipes: state.recipes.map((recipe) =>
                        recipe.id === id ? { ...recipe, ...updates } : recipe
                    ),
                }));
            },

            removeRecipe: (id) => {
                set((state) => ({
                    recipes: state.recipes.filter((r) => r.id !== id),
                    favorites: state.favorites.filter((fid) => fid !== id),
                }));
            },

            toggleFavorite: (id) => {
                set((state) => {
                    const isFavorite = state.favorites.includes(id);
                    const recipe = state.recipes.find((r) => r.id === id);

                    return {
                        favorites: isFavorite
                            ? state.favorites.filter((fid) => fid !== id)
                            : [...state.favorites, id],
                        recipes: recipe
                            ? state.recipes.map((r) =>
                                r.id === id ? { ...r, isFavorite: !isFavorite } : r
                            )
                            : state.recipes,
                    };
                });
            },

            rateRecipe: (id, rating) => {
                set((state) => ({
                    recipes: state.recipes.map((recipe) =>
                        recipe.id === id ? { ...recipe, rating } : recipe
                    ),
                }));
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
