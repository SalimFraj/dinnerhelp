import type { Ingredient, Recipe } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface SubstitutionResult {
    original: string;
    substitutes: {
        name: string;
        ratio: string;
        notes: string;
    }[];
}

export interface MealPlanDay {
    date: string;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
}

export interface GeneratedMealPlan {
    days: MealPlanDay[];
    shoppingList: string[];
    tips: string[];
}

async function callGroqAPI(messages: { role: string; content: string }[]) {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to call AI service');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

export async function getIngredientSubstitutions(
    ingredient: string,
    pantryIngredients: Ingredient[]
): Promise<SubstitutionResult> {
    const availableIngredients = pantryIngredients.map(i => i.name).join(', ');

    const prompt = `You are a culinary expert. Suggest substitutes for "${ingredient}" in cooking.

Available ingredients the user has: ${availableIngredients || 'Unknown'}

Respond in JSON format only:
{
  "original": "${ingredient}",
  "substitutes": [
    {
      "name": "substitute ingredient name",
      "ratio": "ratio compared to original (e.g., '1:1' or '1/2 amount')",
      "notes": "brief tip about using this substitute"
    }
  ]
}

Provide 3-4 substitutes, prioritizing any that match available ingredients. Include common pantry alternatives.`;

    try {
        const response = await callGroqAPI([
            { role: 'system', content: 'You are a helpful culinary assistant. Always respond in valid JSON format only, no markdown.' },
            { role: 'user', content: prompt }
        ]);

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Substitution error:', error);
        // Return fallback
        return {
            original: ingredient,
            substitutes: [
                { name: 'Check online for alternatives', ratio: 'varies', notes: 'AI service unavailable' }
            ]
        };
    }
}

export async function generateWeeklyMealPlan(
    pantryIngredients: Ingredient[],
    preferences: {
        days?: number;
        dietaryRestrictions?: string[];
        cuisinePreferences?: string[];
        maxCookTime?: number;
    } = {}
): Promise<GeneratedMealPlan> {
    const { days = 7, dietaryRestrictions = [], cuisinePreferences = [], maxCookTime } = preferences;

    const ingredientList = pantryIngredients
        .map(i => `${i.name} (${i.quantity} ${i.unit})`)
        .join(', ');

    const expiringItems = pantryIngredients
        .filter(i => {
            if (!i.expirationDate) return false;
            const daysUntil = Math.ceil(
                (new Date(i.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return daysUntil <= 5 && daysUntil >= 0;
        })
        .map(i => i.name);

    const prompt = `Generate a ${days}-day meal plan based on available ingredients.

Available ingredients: ${ingredientList || 'General pantry items'}
${expiringItems.length > 0 ? `\nEXPIRING SOON (prioritize these): ${expiringItems.join(', ')}` : ''}
${dietaryRestrictions.length > 0 ? `\nDietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${cuisinePreferences.length > 0 ? `\nCuisine preferences: ${cuisinePreferences.join(', ')}` : ''}
${maxCookTime ? `\nMax cooking time per meal: ${maxCookTime} minutes` : ''}

Respond in JSON format only:
{
  "days": [
    {
      "date": "Day 1",
      "breakfast": "meal name",
      "lunch": "meal name",
      "dinner": "meal name"
    }
  ],
  "shoppingList": ["item 1", "item 2"],
  "tips": ["tip 1", "tip 2"]
}

Make meals practical and use ingredients efficiently. Include a shopping list for any missing essentials.`;

    try {
        const response = await callGroqAPI([
            { role: 'system', content: 'You are a meal planning expert. Always respond in valid JSON format only, no markdown.' },
            { role: 'user', content: prompt }
        ]);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Meal plan error:', error);
        return {
            days: [],
            shoppingList: [],
            tips: ['AI meal planning service temporarily unavailable']
        };
    }
}

export async function analyzeRecipeNutrition(recipe: Recipe): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    notes: string;
}> {
    const ingredientList = recipe.ingredients
        .map(i => `${i.quantity} ${i.unit || ''} ${i.name}`.trim())
        .join(', ');

    const prompt = `Estimate nutrition information per serving for this recipe:

Recipe: ${recipe.title}
Servings: ${recipe.servings}
Ingredients: ${ingredientList}

Respond in JSON format only:
{
  "calories": estimated_calories_per_serving,
  "protein": grams_protein,
  "carbs": grams_carbohydrates,
  "fat": grams_fat,
  "fiber": grams_fiber,
  "notes": "brief dietary notes"
}

Provide reasonable estimates based on typical ingredient values.`;

    try {
        const response = await callGroqAPI([
            { role: 'system', content: 'You are a nutrition expert. Respond in valid JSON only.' },
            { role: 'user', content: prompt }
        ]);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Nutrition analysis error:', error);
        return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            notes: 'Nutrition data unavailable'
        };
    }
}
