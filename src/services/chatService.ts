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

    return `You are DinnerHelp AI, a friendly and helpful cooking assistant. You help users decide what to cook based on their pantry contents.

CURRENT PANTRY CONTENTS:
${ingredientList || 'No ingredients in pantry yet.'}

${expiringItems.length > 0 ? `⚠️ EXPIRING SOON (use first!): ${expiringItems.join(', ')}` : ''}

YOUR ROLE:
- Suggest recipes based on available ingredients
- Prioritize using ingredients that are expiring soon
- Provide cooking tips and substitution suggestions
- Be encouraging and make cooking feel easy
- Keep responses concise but helpful
- When suggesting recipes, include estimated cook time and difficulty

RESPONSE FORMAT:
- Use markdown formatting for clarity
- Use emoji sparingly for warmth
- If suggesting multiple recipes, use a numbered list
- Always be practical about what can actually be made with available ingredients

Remember: Be conversational, helpful, and make dinner planning feel fun!`;
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

export const quickPrompts = [
    { emoji: '🍽️', text: "What's for dinner?", prompt: "What can I make for dinner tonight with what I have?" },
    { emoji: '⏰', text: 'Quick meal', prompt: "Suggest a quick 15-minute meal with my ingredients" },
    { emoji: '⚠️', text: 'Use expiring', prompt: "What should I cook to use up my expiring ingredients?" },
    { emoji: '🥗', text: 'Healthy option', prompt: "Suggest a healthy meal I can make" },
    { emoji: '👨‍👩‍👧‍👦', text: 'Family dinner', prompt: "What's a good family-friendly dinner I can make?" },
    { emoji: '🎉', text: 'Something special', prompt: "I want to make something special tonight. Any ideas?" },
];
