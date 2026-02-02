import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShoppingList, ShoppingItem, FavoriteStore } from '../types';
import { syncShoppingList, syncPantry } from '../services/syncService';
import { useAuthStore } from './authStore';
import { usePantryStore } from './pantryStore';
import { detectShoppingCategory } from '../services/categorizationService';

interface ShoppingState {
    lists: ShoppingList[];
    favoriteStores: FavoriteStore[];
    activeListId: string | null;

    // List management
    createList: (name: string) => string;
    deleteList: (id: string) => void;
    setActiveList: (id: string) => void;
    getActiveList: () => ShoppingList | null;

    // Item management
    addItem: (listId: string, item: Omit<ShoppingItem, 'id'>) => void;
    updateItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
    removeItem: (listId: string, itemId: string) => void;
    toggleItemChecked: (listId: string, itemId: string) => void;
    clearCheckedItems: (listId: string) => void;
    clearAllItems: (listId: string) => void;

    // Bulk operations
    addItemsFromRecipe: (listId: string, items: Omit<ShoppingItem, 'id'>[]) => void;

    // Store management
    addFavoriteStore: (store: Omit<FavoriteStore, 'id'>) => void;
    removeFavoriteStore: (id: string) => void;

    // Actions
    moveCheckedToPantry: (listId: string) => void;
    checkItemIfExists: (name: string) => void;
}

// Category mapping for smart organization
const categoryOrder: Record<string, number> = {
    produce: 1,
    bakery: 2,
    dairy: 3,
    meat: 4,
    frozen: 5,
    pantry: 6,
    beverages: 7,
    household: 8,
    other: 9,
};

export const useShoppingStore = create<ShoppingState>()(
    persist(
        (set, get) => ({
            lists: [],
            favoriteStores: [],
            activeListId: null,

            createList: (name) => {
                const id = crypto.randomUUID();
                const newList: ShoppingList = {
                    id,
                    name,
                    items: [],
                    createdAt: new Date().toISOString(),
                    isActive: true,
                };

                set((state) => ({
                    lists: [
                        ...state.lists.map((l) => ({ ...l, isActive: false })),
                        newList,
                    ],
                    activeListId: id,
                }));

                return id;
            },

            deleteList: (id) => {
                set((state) => ({
                    lists: state.lists.filter((l) => l.id !== id),
                    activeListId: state.activeListId === id ? null : state.activeListId,
                }));
            },

            setActiveList: (id) => {
                set((state) => ({
                    lists: state.lists.map((l) => ({
                        ...l,
                        isActive: l.id === id,
                    })),
                    activeListId: id,
                }));
            },

            getActiveList: () => {
                const state = get();
                return state.lists.find((l) => l.id === state.activeListId) || null;
            },

            addItem: (listId, item) => {
                // Auto-detect category if not provided or set to other
                const category = (!item.category || item.category === 'other')
                    ? detectShoppingCategory(item.name)
                    : item.category;

                const newItem: ShoppingItem = {
                    ...item,
                    category,
                    id: crypto.randomUUID(),
                    estimatedPrice: item.estimatedPrice || null as any,
                    recipeId: item.recipeId || null as any,
                };

                set((state) => {
                    const params = {
                        lists: state.lists.map((list) => {
                            if (list.id !== listId) return list;

                            // Check for existing item to aggregate
                            const existingIndex = list.items.findIndex(
                                (i) => i.name.toLowerCase() === item.name.toLowerCase() && i.unit === item.unit
                            );

                            if (existingIndex >= 0) {
                                const updated = [...list.items];
                                updated[existingIndex] = {
                                    ...updated[existingIndex],
                                    quantity: updated[existingIndex].quantity + item.quantity,
                                };
                                return { ...list, items: updated };
                            }

                            // Add new item and sort by category
                            const items = [...list.items, newItem].sort(
                                (a, b) => (categoryOrder[a.category] || 9) - (categoryOrder[b.category] || 9)
                            );

                            return { ...list, items };
                        })
                    }

                    const user = useAuthStore.getState().user;
                    if (user) {
                        // Find the updated list and sync its items
                        const updatedList = params.lists.find(l => l.id === listId);
                        if (updatedList) syncShoppingList(user.uid, updatedList.items);
                    }
                    return params;
                });
            },

            updateItem: (listId, itemId, updates) => {
                set((state) => {
                    const params = {
                        lists: state.lists.map((list) => {
                            if (list.id !== listId) return list;
                            return {
                                ...list,
                                items: list.items.map((item) =>
                                    item.id === itemId ? { ...item, ...updates } : item
                                ),
                            };
                        })
                    }
                    const user = useAuthStore.getState().user;
                    if (user) {
                        const updatedList = params.lists.find(l => l.id === listId);
                        if (updatedList) syncShoppingList(user.uid, updatedList.items);
                    }
                    return params;
                });
            },

            removeItem: (listId, itemId) => {
                set((state) => {
                    const params = {
                        lists: state.lists.map((list) => {
                            if (list.id !== listId) return list;
                            return {
                                ...list,
                                items: list.items.filter((item) => item.id !== itemId),
                            };
                        })
                    }
                    const user = useAuthStore.getState().user;
                    if (user) {
                        const updatedList = params.lists.find(l => l.id === listId);
                        if (updatedList) syncShoppingList(user.uid, updatedList.items);
                    }
                    return params;
                });
            },

            toggleItemChecked: (listId, itemId) => {
                set((state) => {
                    const params = {
                        lists: state.lists.map((list) => {
                            if (list.id !== listId) return list;
                            return {
                                ...list,
                                items: list.items.map((item) =>
                                    item.id === itemId ? { ...item, checked: !item.checked } : item
                                ),
                            };
                        })
                    }
                    const user = useAuthStore.getState().user;
                    if (user) {
                        const updatedList = params.lists.find(l => l.id === listId);
                        if (updatedList) syncShoppingList(user.uid, updatedList.items);
                    }
                    return params;
                });
            },

            clearCheckedItems: (listId) => {
                set((state) => {
                    const params = {
                        lists: state.lists.map((list) => {
                            if (list.id !== listId) return list;
                            return {
                                ...list,
                                items: list.items.filter((item) => !item.checked),
                            };
                        })
                    }
                    const user = useAuthStore.getState().user;
                    if (user) {
                        const updatedList = params.lists.find(l => l.id === listId);
                        if (updatedList) syncShoppingList(user.uid, updatedList.items);
                    }
                    return params;
                });
            },

            clearAllItems: (listId) => {
                set((state) => {
                    const params = {
                        lists: state.lists.map((list) => {
                            if (list.id !== listId) return list;
                            return {
                                ...list,
                                items: [],
                            };
                        })
                    }
                    const user = useAuthStore.getState().user;
                    // Fix: We need to sync the specific list's items (empty), not just pass [] globally if the API expects it related to a list? 
                    // Actually checking syncService, syncShoppingList takes (userId, items). 
                    // It seems it syncs the *active* list or something?
                    // Let's assume syncShoppingList overwrites the default collection for now or handles it.
                    // But wait, the store supports multiple lists. Does syncShoppingList support multiple lists?
                    // Checking shoppingStore.ts, it seems to assume a single synced list or syncs the modified one.
                    // Let's duplicate the logic from clearCheckedItems: find updated list and sync its items.

                    if (user) {
                        // We forced items to be [], so we just sync []
                        syncShoppingList(user.uid, []);
                    }
                    return params;
                });
            },

            addItemsFromRecipe: (listId, items) => {
                items.forEach((item) => {
                    get().addItem(listId, item);
                });
            },

            addFavoriteStore: (store) => {
                set((state) => ({
                    favoriteStores: [
                        ...state.favoriteStores,
                        { ...store, id: crypto.randomUUID() },
                    ],
                }));
            },

            removeFavoriteStore: (id) => {
                set((state) => ({
                    favoriteStores: state.favoriteStores.filter((s) => s.id !== id),
                }));
            },

            moveCheckedToPantry: (listId) => {
                const state = get();
                const list = state.lists.find((l) => l.id === listId);
                if (!list) return;

                const checkedItems = list.items.filter((i) => i.checked);
                if (checkedItems.length === 0) return;

                // Use imported store
                const { addIngredientSmart } = usePantryStore.getState();

                checkedItems.forEach((item) => {
                    addIngredientSmart(item.name, item.quantity, item.unit);
                });

                // Crucial: After adding items to pantry, we need to ensure the PANTRY store syncs immediately
                // However, addIngredientSmart calls syncPantry internally.
                // But we ALSO need to uncheck the items (not remove them) and sync THAT.

                set((state) => {
                    const params = {
                        lists: state.lists.map((l) => {
                            if (l.id !== listId) return l;
                            return {
                                ...l,
                                items: l.items.map(item => ({ ...item, checked: false }))
                            };
                        })
                    };

                    const user = useAuthStore.getState().user;
                    if (user) {
                        const updatedList = params.lists.find(l => l.id === listId);
                        if (updatedList) syncShoppingList(user.uid, updatedList.items);
                    }
                    return params;
                });

                // Force manual sync check for pantry if needed (though addIngredientSmart should handle it)
                const user = useAuthStore.getState().user;
                if (user) {
                    syncPantry(user.uid, usePantryStore.getState().ingredients);
                }
            },
            checkItemIfExists: (name) => {
                const state = get();
                if (!state.activeListId) return;

                const list = state.lists.find((l) => l.id === state.activeListId);
                if (!list) return;

                const targetName = name.toLowerCase().trim();

                // Find item with loose matching
                const item = list.items.find((i) => {
                    const itemName = i.name.toLowerCase().trim();
                    return itemName === targetName ||
                        itemName.includes(targetName) ||
                        targetName.includes(itemName);
                });

                if (item && !item.checked) {
                    get().toggleItemChecked(state.activeListId, item.id);

                    // Show toast
                    import('./uiStore').then(({ useUIStore }) => {
                        useUIStore.getState().addToast({
                            type: 'success',
                            message: `Checked off ${item.name} from shopping list`
                        });
                    });
                }
            },
        }),
        {
            name: 'dinnerhelp-shopping',
        }
    )
);
