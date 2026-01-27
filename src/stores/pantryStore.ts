import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ingredient, IngredientCategory } from '../types';
import { detectIngredientCategory, suggestUnit } from '../services/categorizationService';

interface PantryState {
    ingredients: Ingredient[];
    addIngredient: (ingredient: Omit<Ingredient, 'id' | 'addedAt'>) => void;
    addIngredientSmart: (name: string, quantity?: number, unit?: string, expirationDate?: string) => void;
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
                // Auto-detect category if set to 'other' or not optimal
                let category: IngredientCategory = ingredient.category;
                if (category === 'other') {
                    const detected = detectIngredientCategory(ingredient.name);
                    if (detected !== 'other') {
                        category = detected;
                    }
                }

                const newIngredient: Ingredient = {
                    ...ingredient,
                    category,
                    id: crypto.randomUUID(),
                    addedAt: new Date().toISOString(),
                };
                set((state) => ({
                    ingredients: [...state.ingredients, newIngredient],
                }));
            },

            // Smart add - auto-detects category and unit
            addIngredientSmart: (name, quantity = 1, unit, expirationDate) => {
                const category = detectIngredientCategory(name);
                const suggestedUnit = unit || suggestUnit(name, category);

                const newIngredient: Ingredient = {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    category,
                    quantity,
                    unit: suggestedUnit,
                    expirationDate,
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
