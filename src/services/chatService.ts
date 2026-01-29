import type { Ingredient } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file.');
    }

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
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key missing');
    }

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
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
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
