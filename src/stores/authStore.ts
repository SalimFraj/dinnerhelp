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
    setCachedHouseholdId,
    type UserData,
} from '../services/syncService';
import { getUserHouseholdId } from '../services/householdService';
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
    refreshSync: () => Promise<void>;
    setSyncEnabled: (enabled: boolean) => void;
}

// Keep track of unsubscribe function outside of store to avoid serialization issues
let unsubscribeListener: (() => void) | null = null;

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
                        // Clear any existing listener
                        if (unsubscribeListener) {
                            unsubscribeListener();
                            unsubscribeListener = null;
                        }

                        // Get and cache household ID for sync routing BEFORE loading data
                        // This ensures we load from the correct collection (Household vs User)
                        const householdId = await getUserHouseholdId(user.uid);
                        setCachedHouseholdId(householdId);

                        // Force a small delay to ensure cache is set? No, await should suffice if setCachedHouseholdId is sync.
                        // It is sync. So subsequent getDataDocRefSync calls will use it.

                        // Load data from cloud when user logs in
                        await get().loadFromCloud();

                        // Subscribe to real-time updates and save listener
                        unsubscribeListener = subscribeToUserData(user.uid, (data) => {
                            if (data) {
                                // Update local stores with cloud data
                                // This enables real-time sync across devices
                                console.log('Received cloud update:', data.lastSynced);

                                // Process the updates (same logic as loadFromCloud)
                                // Process the updates (same logic as loadFromCloud)
                                if (data.pantry) usePantryStore.setState({ ingredients: data.pantry });
                                if (data.shoppingLists?.items) {
                                    const shoppingStore = useShoppingStore.getState();
                                    let targetListId = shoppingStore.activeListId || shoppingStore.lists[0]?.id;

                                    if (targetListId) {
                                        useShoppingStore.setState(state => ({
                                            lists: state.lists.map(l =>
                                                l.id === targetListId
                                                    ? { ...l, items: data.shoppingLists.items }
                                                    : l
                                            )
                                        }));
                                    } else {
                                        // If no list exists, create one (we can't easily do it inside setState, 
                                        // but usually loadFromCloud handles initialization)
                                        const newListId = shoppingStore.createList('My Shopping List');
                                        useShoppingStore.setState(state => ({
                                            lists: state.lists.map(l =>
                                                l.id === newListId
                                                    ? { ...l, items: data.shoppingLists.items }
                                                    : l
                                            )
                                        }));
                                    }
                                }
                                if (data.mealPlans) useMealPlanStore.setState({ mealPlans: data.mealPlans });
                                if (data.favorites) useRecipeStore.setState({ favorites: data.favorites });
                                if (data.recipes) {
                                    data.recipes.forEach(recipe => useRecipeStore.getState().addRecipe(recipe));
                                }

                                set({ lastSynced: data.lastSynced || null });
                            }
                        });
                    } else {
                        setCachedHouseholdId(null);
                        if (unsubscribeListener) {
                            unsubscribeListener();
                            unsubscribeListener = null;
                        }
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
                        // Sync shopping list items
                        // Since cloud only stores one list currently, we update the active/first list or create one
                        const shoppingStore = useShoppingStore.getState();
                        let targetListId = shoppingStore.activeListId;

                        if (!targetListId && shoppingStore.lists.length > 0) {
                            targetListId = shoppingStore.lists[0].id;
                        } else if (!targetListId) {
                            targetListId = shoppingStore.createList('My Shopping List');
                        }

                        // We can't easily replace the whole list via action, so we might need a direct setter or careful merge
                        // For now, let's update the items of the target list
                        useShoppingStore.setState(state => ({
                            lists: state.lists.map(l =>
                                l.id === targetListId
                                    ? { ...l, items: cloudData.shoppingLists.items }
                                    : l
                            )
                        }));
                    }
                    if (cloudData.mealPlans) {
                        useMealPlanStore.setState({ mealPlans: cloudData.mealPlans });
                    }
                    if (cloudData.favorites) {
                        useRecipeStore.setState({ favorites: cloudData.favorites });
                    }
                    if (cloudData.recipes) {
                        // Deduplicate incoming recipes from cloud but PRESERVE existing local recipes (e.g. Discovered ones)
                        const currentRecipes = useRecipeStore.getState().recipes;
                        const uniqueRecipes = new Map();

                        // 1. Add existing local recipes first (preserving discovery data)
                        currentRecipes.forEach(r => uniqueRecipes.set(r.id, r));

                        // 2. Merge/Overwrite with Cloud recipes (Custom/Saved ones)
                        cloudData.recipes.forEach(r => uniqueRecipes.set(r.id, r));

                        // 3. Update store
                        useRecipeStore.setState({ recipes: Array.from(uniqueRecipes.values()) });
                    }

                    set({ lastSynced: cloudData.lastSynced || null });
                } catch (error) {
                    console.error('Load from cloud failed:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            refreshSync: async () => {
                const { user, syncEnabled } = get();
                if (!user || !syncEnabled) return;

                // 1. Unsubscribe existing listener
                if (unsubscribeListener) {
                    unsubscribeListener();
                    unsubscribeListener = null;
                }

                set({ isLoading: true });
                try {
                    // 2. Refresh cached household ID
                    const householdId = await getUserHouseholdId(user.uid);
                    setCachedHouseholdId(householdId);

                    // 3. Load fresh data
                    await get().loadFromCloud();

                    // 4. Setup new subscription
                    unsubscribeListener = subscribeToUserData(user.uid, (data) => {
                        if (data) {
                            // Update local stores
                            if (data.pantry) usePantryStore.setState({ ingredients: data.pantry });
                            if (data.mealPlans) useMealPlanStore.setState({ mealPlans: data.mealPlans });
                            if (data.favorites) useRecipeStore.setState({ favorites: data.favorites });
                            if (data.recipes) {
                                data.recipes.forEach(recipe => useRecipeStore.getState().addRecipe(recipe));
                            }
                            set({ lastSynced: data.lastSynced || null });
                        }
                    });
                } catch (error) {
                    console.error('Refresh sync failed:', error);
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
