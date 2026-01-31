import { usePantryStore } from '../stores/pantryStore';
import { useShoppingStore } from '../stores/shoppingStore';
import type { Ingredient } from '../types';

/**
 * Service to handle actions that span multiple stores
 * This helps avoid circular dependencies between stores
 */

export const actionService = {
    /**
     * Add an ingredient to pantry and automatically check it off the shopping list
     */
    addPantryItem: (ingredient: Omit<Ingredient, 'id' | 'addedAt'>) => {
        // 1. Add to pantry
        usePantryStore.getState().addIngredient(ingredient);

        // 2. Check off shopping list
        useShoppingStore.getState().checkItemIfExists(ingredient.name);
    },

    /**
     * Smart add ingredient to pantry and check off shopping list
     */
    addPantryItemSmart: (name: string, quantity?: number, unit?: string, expirationDate?: string) => {
        // 1. Add to pantry
        usePantryStore.getState().addIngredientSmart(name, quantity, unit, expirationDate);

        // 2. Check off shopping list
        useShoppingStore.getState().checkItemIfExists(name);
    }
};
