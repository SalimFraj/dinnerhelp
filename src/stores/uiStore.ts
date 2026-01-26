import { create } from 'zustand';
import type { Toast } from '../types';

interface UIState {
    toasts: Toast[];
    isVoiceListening: boolean;
    isScannerOpen: boolean;
    isLoading: boolean;

    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    setVoiceListening: (listening: boolean) => void;
    setScannerOpen: (open: boolean) => void;
    setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    toasts: [],
    isVoiceListening: false,
    isScannerOpen: false,
    isLoading: false,

    addToast: (toast) => {
        const id = crypto.randomUUID();
        const duration = toast.duration ?? 4000;

        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto remove after duration
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, duration);
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },

    setVoiceListening: (listening) => {
        set({ isVoiceListening: listening });
    },

    setScannerOpen: (open) => {
        set({ isScannerOpen: open });
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },
}));
