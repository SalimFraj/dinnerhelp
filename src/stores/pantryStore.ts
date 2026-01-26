import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ingredient } from '../types';

interface PantryState {
    ingredients: Ingredient[];
    addIngredient: (ingredient: Omit<Ingredient, 'id' | 'addedAt'>) => void;
    updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
    removeIngredient: (id: string) => void;
    clearPantry: () => void;
    getIngredientsByCategory: (category: string) => Ingredient[];
    searchIngredients: (query: string) => Ingredient[];
}

export const usePantryStore = create<PantryState>()(
    persist(
        (set, get) => ({
            ingredients: [],

            addIngredient: (ingredient) => {
                const newIngredient: Ingredient = {
                    ...ingredient,
                    id: crypto.randomUUID(),
                    addedAt: new Date().toISOString(),
                };
                set((state) => ({
                    ingredients: [...state.ingredients, newIngredient],
                }));
            },

            updateIngredient: (id, updates) => {
                set((state) => ({
                    ingredients: state.ingredients.map((ing) =>
                        ing.id === id ? { ...ing, ...updates } : ing
                    ),
                }));
            },

            removeIngredient: (id) => {
                set((state) => ({
                    ingredients: state.ingredients.filter((ing) => ing.id !== id),
                }));
            },

            clearPantry: () => {
                set({ ingredients: [] });
            },

            getIngredientsByCategory: (category) => {
                return get().ingredients.filter((ing) => ing.category === category);
            },

            searchIngredients: (query) => {
                const lowerQuery = query.toLowerCase();
                return get().ingredients.filter((ing) =>
                    ing.name.toLowerCase().includes(lowerQuery)
                );
            },
        }),
        {
            name: 'dinnerhelp-pantry',
        }
    )
);
