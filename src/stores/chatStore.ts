import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    recipes?: {
        id: string;
        title: string;
        cookTime: number;
        difficulty: string;
    }[];
}

interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;

    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
    setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            messages: [],
            isLoading: false,

            addMessage: (message) => {
                const newMessage: ChatMessage = {
                    ...message,
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                };
                set((state) => ({
                    messages: [...state.messages, newMessage],
                }));
            },

            clearMessages: () => {
                set({ messages: [] });
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },
        }),
        {
            name: 'dinnerhelp-chat',
        }
    )
);
