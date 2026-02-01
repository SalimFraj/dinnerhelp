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
    },

    /**
     * Deduct ingredients from pantry when cooking a recipe
     */
    cookRecipe: (recipeIngredients: { name: string; quantity: string }[]) => {
        const pantryStore = usePantryStore.getState();
        const pantryItems = pantryStore.ingredients;
        let deductedCount = 0;

        recipeIngredients.forEach(ing => {
            // Fuzzy match: check if pantry item name contains ingredient name or vice versa
            // e.g. "Ground Beef" matches "Beef", "Large Eggs" matches "Eggs"
            const match = pantryItems.find(p =>
                p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
                ing.name.toLowerCase().includes(p.name.toLowerCase())
            );

            if (match) {
                // Parse recipe quantity (e.g. "2 cups")
                const qtyMatch = ing.quantity.match(/^([\d.]+)\s*([a-zA-Z]+)?/);
                const recipeQty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;

                // Simple deduction logic:
                // If pantry quantity > recipe quantity, subtract
                // If pantry is low, just remove perfectly or leave at 0? 
                // Let's protect against negative numbers

                // TODO: Better Unit Conversion (lb vs oz, kg vs g)
                // For now, valid if units loosely match or one is missing

                let newQty = match.quantity;
                if (newQty >= recipeQty) {
                    newQty = newQty - recipeQty;
                } else {
                    newQty = 0; // Used it all up
                }

                if (newQty <= 0) {
                    // Option: Auto-remove empty items? Or keep them? 
                    // Users might prefer to keep empty item to add to shopping list later.
                    // But for "Automatic" feel, let's remove if completely used.
                    pantryStore.removeIngredient(match.id);
                } else {
                    pantryStore.updateIngredient(match.id, { quantity: newQty });
                }

                deductedCount++;
            }
        });

        return deductedCount;
    }
};
