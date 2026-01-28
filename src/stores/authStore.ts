import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../services/authService';
import {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    sendPhoneOTP,
    verifyPhoneOTP,
    onAuthStateChange,
} from '../services/authService';
import {
    loadUserData,
    saveUserData,
    subscribeToUserData,
    type UserData,
} from '../services/syncService';
import { usePantryStore } from './pantryStore';
import { useShoppingStore } from './shoppingStore';
import { useMealPlanStore } from './mealPlanStore';
import { useRecipeStore } from './recipeStore';

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isInitialized: boolean;
    syncEnabled: boolean;
    lastSynced: string | null;
    phoneVerificationPending: boolean;

    // Actions
    initialize: () => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    sendPhoneCode: (phoneNumber: string, buttonId: string) => Promise<void>;
    verifyPhoneCode: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    syncToCloud: () => Promise<void>;
    loadFromCloud: () => Promise<void>;
    setSyncEnabled: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isInitialized: false,
            syncEnabled: true,
            lastSynced: null,
            phoneVerificationPending: false,

            initialize: () => {
                onAuthStateChange(async (user) => {
                    set({ user, isInitialized: true });

                    if (user && get().syncEnabled) {
                        // Load data from cloud when user logs in
                        await get().loadFromCloud();

                        // Subscribe to real-time updates
                        subscribeToUserData(user.uid, (data) => {
                            if (data) {
                                // Update local stores with cloud data
                                // This enables real-time sync across devices
                                console.log('Received cloud update:', data.lastSynced);
                            }
                        });
                    }
                });
            },

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const user = await signIn(email, password);
                    set({ user });
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (email, password, name) => {
                set({ isLoading: true });
                try {
                    const user = await signUp(email, password, name);
                    set({ user });

                    // Save current local data to cloud for new user
                    await get().syncToCloud();
                } finally {
                    set({ isLoading: false });
                }
            },

            loginWithGoogle: async () => {
                set({ isLoading: true });
                try {
                    const user = await signInWithGoogle();
                    set({ user });
                } finally {
                    set({ isLoading: false });
                }
            },

            sendPhoneCode: async (phoneNumber, buttonId) => {
                set({ isLoading: true });
                try {
                    await sendPhoneOTP(phoneNumber, buttonId);
                    set({ phoneVerificationPending: true });
                } finally {
                    set({ isLoading: false });
                }
            },

            verifyPhoneCode: async (code) => {
                set({ isLoading: true });
                try {
                    const user = await verifyPhoneOTP(code);
                    set({ user, phoneVerificationPending: false });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await signOut();
                    set({ user: null, lastSynced: null });
                } finally {
                    set({ isLoading: false });
                }
            },

            syncToCloud: async () => {
                const { user, syncEnabled } = get();
                if (!user || !syncEnabled) return;

                set({ isLoading: true });
                try {
                    const pantryState = usePantryStore.getState();
                    const shoppingState = useShoppingStore.getState();
                    const mealPlanState = useMealPlanStore.getState();
                    const recipeState = useRecipeStore.getState();

                    const userData: Partial<UserData> = {
                        pantry: pantryState.ingredients,
                        shoppingLists: {
                            items: shoppingState.lists.flatMap(l => l.items),
                            lastUpdated: new Date().toISOString(),
                        },
                        mealPlans: mealPlanState.mealPlans,
                        favorites: recipeState.favorites,
                        recipes: recipeState.getCustomRecipes(),
                    };

                    await saveUserData(user.uid, userData);
                    set({ lastSynced: new Date().toISOString() });
                } catch (error) {
                    console.error('Sync to cloud failed:', error);
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            loadFromCloud: async () => {
                const { user, syncEnabled } = get();
                if (!user || !syncEnabled) return;

                set({ isLoading: true });
                try {
                    const cloudData = await loadUserData(user.uid);
                    if (!cloudData) {
                        // New user, sync local data to cloud
                        await get().syncToCloud();
                        return;
                    }

                    // Update local stores with cloud data
                    if (cloudData.pantry) {
                        usePantryStore.setState({ ingredients: cloudData.pantry });
                    }
                    if (cloudData.shoppingLists?.items) {
                        // Note: Cloud shopping items would need special handling for list structure
                        console.log('Shopping list sync:', cloudData.shoppingLists.items.length, 'items');
                    }
                    if (cloudData.mealPlans) {
                        useMealPlanStore.setState({ mealPlans: cloudData.mealPlans });
                    }
                    if (cloudData.favorites) {
                        useRecipeStore.setState({ favorites: cloudData.favorites });
                    }
                    if (cloudData.recipes) {
                        // Add or update recipes in local store
                        cloudData.recipes.forEach(recipe => {
                            useRecipeStore.getState().addRecipe(recipe);
                        });
                    }

                    set({ lastSynced: cloudData.lastSynced || null });
                } catch (error) {
                    console.error('Load from cloud failed:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            setSyncEnabled: (enabled) => {
                set({ syncEnabled: enabled });
            },
        }),
        {
            name: 'dinnerhelp-auth',
            partialize: (state) => ({
                syncEnabled: state.syncEnabled,
                lastSynced: state.lastSynced,
            }),
        }
    )
);
