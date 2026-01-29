// Core Types for DinnerHelp

export interface Ingredient {
    id: string;
    name: string;
    category: IngredientCategory;
    quantity: number;
    unit: string;
    expirationDate?: string | null;
    addedAt: string;
}

export type IngredientCategory =
    | 'produce'
    | 'meat'
    | 'dairy'
    | 'grains'
    | 'canned'
    | 'frozen'
    | 'spices'
    | 'condiments'
    | 'beverages'
    | 'snacks'
    | 'other';

export interface Recipe {
    id: string;
    title: string;
    description?: string;
    image?: string;
    cookTime: number; // in minutes
    prepTime?: number;
    difficulty: DifficultyLevel;
    servings: number;
    ingredients: RecipeIngredient[];
    instructions: string[];
    source: 'mealdb' | 'ai' | 'custom';
    sourceId?: string;
    category?: string;
    cuisine?: string;
    isFavorite: boolean;
    rating: number; // 0-5
    isCustom: boolean;
    createdAt?: string;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface RecipeIngredient {
    name: string;
    quantity: string;
    unit?: string;
}

export interface ShoppingItem {
    id: string;
    name: string;
    category: ShoppingCategory;
    quantity: number;
    unit: string;
    estimatedPrice?: number;
    checked: boolean;
    recipeId?: string;
}

export type ShoppingCategory =
    | 'produce'
    | 'meat'
    | 'dairy'
    | 'bakery'
    | 'frozen'
    | 'pantry'
    | 'beverages'
    | 'household'
    | 'other';

export interface ShoppingList {
    id: string;
    name: string;
    items: ShoppingItem[];
    createdAt: string;
    isActive: boolean;
}

export interface MealPlan {
    id: string;
    date: string;
    mealType: MealType;
    recipeId: string;
    recipe?: Recipe;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FavoriteStore {
    id: string;
    name: string;
    address?: string;
}

// API Response types
export interface MealDBResponse {
    meals: MealDBMeal[] | null;
}

export interface MealDBMeal {
    idMeal: string;
    strMeal: string;
    strCategory: string;
    strArea: string;
    strInstructions: string;
    strMealThumb: string;
    strTags?: string;
    strYoutube?: string;
    [key: string]: string | undefined; // For ingredient/measure fields
}

// AI types
export interface AIRecipeSuggestion {
    title: string;
    description: string;
    cookTime: number;
    difficulty: DifficultyLevel;
    servings: number;
    ingredients: RecipeIngredient[];
    instructions: string[];
}

export interface AISubstitution {
    original: string;
    substitute: string;
    notes: string;
}

// Voice command types
export interface VoiceCommand {
    type: 'add_ingredient' | 'search_recipe' | 'navigate' | 'unknown';
    data?: Record<string, string>;
    rawText: string;
}

// Toast notifications
export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}
