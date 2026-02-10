import type { Ingredient } from '../types';

const GROQ_PROXY_URL = '/api/groq';

interface ChatResponse {
    message: string;
    recipes?: {
        id: string;
        title: string;
        cookTime: number;
        difficulty: string;
    }[];
}

function buildSystemPrompt(pantryIngredients: Ingredient[]): string {
    const ingredientList = pantryIngredients
        .map(i => {
            const expiry = i.expirationDate
                ? ` (expires: ${new Date(i.expirationDate).toLocaleDateString()})`
                : '';
            return `- ${i.name}: ${i.quantity} ${i.unit}${expiry}`;
        })
        .join('\n');

    const expiringItems = pantryIngredients
        .filter(i => {
            if (!i.expirationDate) return false;
            const daysUntil = Math.ceil(
                (new Date(i.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return daysUntil <= 3 && daysUntil >= 0;
        })
        .map(i => i.name);

    return `You are DinnerHelp AI, a warm and enthusiastic cooking assistant who loves helping people create delicious meals. You know the user's pantry contents and help them decide what to cook.

PANTRY CONTENTS:
${ingredientList || 'Empty pantry - suggest adding some basics!'}

${expiringItems.length > 0 ? `🚨 USE SOON: ${expiringItems.join(', ')} (expiring in 3 days or less!)` : ''}

GUIDELINES:
1. Be warm, encouraging, and make cooking feel fun - not stressful
2. Prioritize ingredients expiring soon
3. Give practical recipes based on what they actually have
4. Include prep time, cook time, and difficulty (Easy/Medium/Hard)
5. Be concise - users want quick answers

FORMATTING RULES:
- Use **bold** for recipe names and important terms
- Use numbered lists for recipe steps (1. 2. 3.)
- Use bullet points (-) for ingredient lists
- Keep recipes to essential steps only
- Add helpful emojis sparingly (🍳 ⏰ 💡 etc.)
- Separate sections with blank lines

WHEN SUGGESTING RECIPES:
**Recipe Name** 🍽️
- ⏰ Time: X mins | Difficulty: Easy/Medium/Hard
- Ingredients: list what they need
- Quick steps: numbered list

End responses with a helpful tip or encouraging note!`;
}

export async function sendChatMessage(
    userMessage: string,
    pantryIngredients: Ingredient[],
    conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<ChatResponse> {
    const systemPrompt = buildSystemPrompt(pantryIngredients);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
        })),
        { role: 'user', content: userMessage },
    ];

    try {
        const response = await fetch(GROQ_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get response from AI');
        }

        const data = await response.json();
        const aiMessage = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

        return {
            message: aiMessage,
        };
    } catch (error) {
        console.error('Chat API error:', error);
        throw error;
    }
}

export type VoiceIntent =
    | { type: 'ADD_PANTRY'; items: { name: string; quantity?: number; unit?: string }[] }
    | { type: 'ADD_SHOPPING'; items: { name: string; quantity?: number; unit?: string }[] }
    | { type: 'NAVIGATE'; page: string }
    | { type: 'CHAT'; query: string };

export async function processVoiceIntent(transcript: string): Promise<VoiceIntent> {
    const systemPrompt = `You are a smart home assistant intent parser.
Extract the user's intent from the voice transcript.
Return strictly valid JSON matching this schema:
type VoiceIntent = 
    | { type: 'ADD_PANTRY'; items: { name: string; quantity?: number; unit?: string }[] }
    | { type: 'ADD_SHOPPING'; items: { name: string; quantity?: number; unit?: string }[] }
    | { type: 'NAVIGATE'; page: 'pantry' | 'recipes' | 'shopping' | 'plan' | 'home' | 'settings' | 'chat' }
    | { type: 'CHAT'; query: string };

Examples:
"Add 2 lbs of chicken and milk" -> {"type": "ADD_PANTRY", "items": [{"name": "chicken", "quantity": 2, "unit": "lbs"}, {"name": "milk"}]}
"I need to buy tomatoes" -> {"type": "ADD_SHOPPING", "items": [{"name": "tomatoes"}]}
"Go to my shopping list" -> {"type": "NAVIGATE", "page": "shopping"}
"What can I cook?" -> {"type": "CHAT", "query": "What can I cook?"}
"Suggest a dinner" -> {"type": "CHAT", "query": "Suggest a dinner"}

If the request implies buying/shopping, use ADD_SHOPPING.
If it implies having/storing, use ADD_PANTRY.
If it's a question or general request, use CHAT.
If it's a navigation command, use NAVIGATE.`;

    try {
        const response = await fetch(GROQ_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: transcript }
                ],
                temperature: 0,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) throw new Error('AI request failed');

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) throw new Error('No content received');

        return JSON.parse(content) as VoiceIntent;
    } catch (error) {
        console.error('Voice intent error:', error);
        // Fallback: simple chat query
        return { type: 'CHAT', query: transcript };
    }
}

export const quickPrompts = [
    { emoji: '🍽️', text: "What's for dinner?", prompt: "What can I make for dinner tonight with what I have?" },
    { emoji: '⏰', text: 'Quick meal', prompt: "Suggest a quick 15-minute meal with my ingredients" },
    { emoji: '⚠️', text: 'Use expiring', prompt: "What should I cook to use up my expiring ingredients?" },
    { emoji: '🥗', text: 'Healthy option', prompt: "Suggest a healthy meal I can make" },
    { emoji: '👨‍👩‍👧‍👦', text: 'Family dinner', prompt: "What's a good family-friendly dinner I can make?" },
    { emoji: '🎉', text: 'Something special', prompt: "I want to make something special tonight. Any ideas?" },
];

export async function cleanReceiptText(items: { name: string; quantity?: number; price?: number }[]): Promise<{ name: string; quantity?: number; price?: number; originalName: string }[]> {
    const itemStrings = items.map(i => `- ${i.name}`).join('\n');

    const systemPrompt = `You are an advanced receipt parser for a smart pantry app.
Your goal is to transform raw OCR receipt text into clean, clear, and standardized ingredient names.

INPUT CONTEXT:
The user scans a grocery receipt. The text often contains:
- Store brands (Kroger, Kirkland, Great Value) -> REMOVE these.
- Abbreviations (chk, bnlss, sknlss) -> EXPAND these.
- Weights/Pack sizes (1lb, 12oz, gal) -> KEEP if relevant to the item identity (e.g. "Milk Gallon"), REMOVE if just a quantity.
- Gibberish or codes -> REMOVE.

EXAMPLES:
"KROG LRG EGGS 12CT" -> "Large Eggs"
"PC TRUF PARM CHP" -> "Truffle Parmesan Chips"
"BNLSS SKNLSS CHCK BRST" -> "Boneless Skinless Chicken Breast"
"ORG BANANAS" -> "Organic Bananas"
"GAL WHL MILK" -> "Whole Milk"
"AVOCADO LRG" -> "Avocado"
"MTN DEW 12PK" -> "Mountain Dew"

INSTRUCTIONS:
1. Analyze each line item.
2. Infer the likely product.
3. Return a clean, Title Cased string for the pantry.
4. If the item is ambiguous, make your best guess based on common grocery items.
5. Return a JSON object with an "items" array strictly matching the input order.

JSON FORMAT:
{
  "items": [
    "Clean Name 1",
    "Clean Name 2"
  ]
}`;

    try {
        const response = await fetch(GROQ_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: itemStrings }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) throw new Error('AI request failed');

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        let cleanedNames: string[] = [];
        try {
            const parsed = JSON.parse(content);
            if (parsed.items && Array.isArray(parsed.items)) {
                cleanedNames = parsed.items;
            } else if (Array.isArray(parsed)) {
                cleanedNames = parsed;
            } else {
                // Try to find any array
                const firstArray = Object.values(parsed).find(v => Array.isArray(v));
                if (firstArray) cleanedNames = firstArray as string[];
            }
        } catch (e) {
            console.error('Failed to parse AI cleaning response', e);
            cleanedNames = [];
        }

        return items.map((item, index) => ({
            ...item,
            originalName: item.name,
            name: cleanedNames[index] || item.name
        }));

    } catch (error) {
        console.error('AI Receipt Cleaning Error:', error);
        return items.map(i => ({ ...i, originalName: i.name }));
    }
}

export async function parseShoppingList(rawText: string): Promise<{ name: string; quantity: number; category?: string }[]> {
    const systemPrompt = `You are a smart shopping list parser.
Your job is to convert unstructured text into a structured shopping list.

INPUT:
"2 milk, eggs, gallon of water, 1lb beef"

OUTPUT JSON:
{
  "items": [
    { "name": "Milk", "quantity": 2, "category": "dairy" },
    { "name": "Eggs", "quantity": 12, "category": "dairy" },
    { "name": "Water", "quantity": 1, "category": "beverages", "unit": "gallon" },
    { "name": "Ground Beef", "quantity": 1, "category": "meat", "unit": "lb" }
  ]
}

CATEGORIES: produce, meat, dairy, bakery, frozen, pantry, beverages, household, other.

RULES:
1. Infer quantity from text (e.g., "2 apples" -> 2). Default to 1.
2. Infer category based on item.
3. Clean up names (Title Case).
4. Return JSON object with "items" array.`;

    try {
        const response = await fetch(GROQ_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: rawText }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) throw new Error('AI request failed');

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        const parsed = JSON.parse(content);

        return parsed.items || [];

    } catch (error) {
        console.error('AI List Parsing Error:', error);
        // Fallback: simple newline split
        return rawText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(name => ({ name, quantity: 1, category: 'other' }));
    }
}
