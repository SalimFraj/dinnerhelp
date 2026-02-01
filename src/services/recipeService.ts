import type { Recipe, MealDBMeal, DifficultyLevel } from '../types';

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Fetch random recipes from TheMealDB
export async function fetchRecipes(count = 10): Promise<Recipe[]> {
    const recipes: Recipe[] = [];

    // Fetch multiple random meals
    const promises = Array.from({ length: count }, () =>
        fetch(`${MEALDB_BASE}/random.php`).then(res => res.json())
    );

    const results = await Promise.all(promises);

    results.forEach(data => {
        if (data.meals && data.meals[0]) {
            const recipe = transformMealDBRecipe(data.meals[0]);
            if (!recipes.some(r => r.id === recipe.id)) {
                recipes.push(recipe);
            }
        }
    });

    return recipes;
}

// Search recipes by name
export async function searchRecipes(query: string): Promise<Recipe[]> {
    const response = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data.meals) return [];

    return data.meals.map(transformMealDBRecipe);
}

// Search recipes by ingredient
export async function searchByIngredient(ingredient: string): Promise<Recipe[]> {
    const response = await fetch(`${MEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
    const data = await response.json();

    if (!data.meals) return [];

    // Filter API returns limited data, need to fetch full details
    const fullRecipes = await Promise.all(
        data.meals.slice(0, 10).map(async (meal: { idMeal: string }) => {
            const detailRes = await fetch(`${MEALDB_BASE}/lookup.php?i=${meal.idMeal}`);
            const detailData = await detailRes.json();
            return detailData.meals?.[0] ? transformMealDBRecipe(detailData.meals[0]) : null;
        })
    );

    return fullRecipes.filter(Boolean) as Recipe[];
}

// Transform MealDB format to our Recipe format
function transformMealDBRecipe(meal: MealDBMeal): Recipe {
    const ingredients: Recipe['ingredients'] = [];

    // MealDB has strIngredient1-20 and strMeasure1-20
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];

        if (ingredient && ingredient.trim()) {
            ingredients.push({
                name: ingredient.trim(),
                quantity: measure?.trim() || '',
            });
        }
    }

    // Estimate cook time based on instruction length
    const instructionLength = meal.strInstructions?.length || 500;
    const estimatedCookTime = Math.min(90, Math.max(15, Math.round(instructionLength / 50) * 5));

    // Estimate difficulty based on ingredient count
    const difficulty: DifficultyLevel =
        ingredients.length <= 5 ? 'easy' :
            ingredients.length <= 10 ? 'medium' : 'hard';

    return {
        id: `mealdb-${meal.idMeal}`,
        title: meal.strMeal,
        description: meal.strInstructions?.substring(0, 150) + '...',
        image: meal.strMealThumb,
        cookTime: estimatedCookTime,
        difficulty,
        servings: 4,
        ingredients,
        instructions: meal.strInstructions?.split('\r\n').filter(Boolean) || [],
        source: 'mealdb',
        sourceId: meal.idMeal,
        category: meal.strCategory,
        cuisine: meal.strArea,
        isFavorite: false,
        rating: 0,
        isCustom: false,
    };
}

// Generate 7-day Meal Plan using Groq
export async function generateAISuggestions(
    pantryIngredients: string[],
    favoriteRecipes: string[] = []
): Promise<Recipe[]> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('Groq API key not configured');
    }

    const favoritesContext = favoriteRecipes.length > 0
        ? `User loves these recipes: ${favoriteRecipes.slice(0, 5).join(', ')}. Use similar flavor profiles.`
        : '';

    const prompt = `You are a personal chef. Create a 7-DAY MEAL PLAN (21 distinct recipes: 7 Breakfasts, 7 Lunches, 7 Dinners) based on:
1. Available Ingredients: ${pantryIngredients.join(', ')}. (Prioritize using these to reduce waste).
2. Preferences: ${favoritesContext}

REQUIREMENTS:
- Generate exactly 21 recipes.
- Mark each with a "category": "Breakfast", "Lunch", or "Dinner".
- "isCustom": true (CRITICAL for saving).
- "source": "ai".
- Instructions can be simplified (3-5 steps).

Respond ONLY in this valid JSON format (no markdown code blocks):
{
  "recipes": [
    {
      "title": "Recipe Name",
      "category": "Breakfast",
      "description": "Brief description",
      "cookTime": 15,
      "difficulty": "easy",
      "servings": 4,
      "ingredients": [{"name": "ingredient", "quantity": "1 cup"}],
      "instructions": ["Step 1", "Step 2"]
    }
  ]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a robust meal planning AI. Always respond with valid JSON containing exactly 21 recipes.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 6000,
            response_format: { type: 'json_object' }
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate AI suggestions');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
        throw new Error('No response from AI');
    }

    // Parse JSON
    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        // Fallback cleanup if model adds markdown
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response format');
        parsed = JSON.parse(jsonMatch[0]);
    }

    return parsed.recipes.map((recipe: any, index: number): Recipe => ({
        id: `ai-${Date.now()}-${index}`,
        title: recipe.title,
        description: recipe.description,
        cookTime: recipe.cookTime || 30,
        difficulty: recipe.difficulty || 'medium',
        servings: recipe.servings || 4,
        ingredients: recipe.ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: ing.quantity || '',
        })),
        instructions: recipe.instructions || [],
        source: 'ai',
        // Ensure category matches one of our expected types if possible, or keep as string
        category: recipe.category || 'Dinner',
        cuisine: 'International',
        isFavorite: false,
        rating: 0,
        isCustom: true, // Key for persistence
        createdAt: new Date().toISOString()
    }));
}

// Get AI substitution suggestions
export async function getSubstitutions(ingredient: string): Promise<string[]> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        return [];
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'user',
                    content: `What are 3 good substitutes for ${ingredient} in cooking? List only the substitutes, one per line.`,
                },
            ],
            temperature: 0.5,
            max_tokens: 200,
        }),
    });

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return content.split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
}
