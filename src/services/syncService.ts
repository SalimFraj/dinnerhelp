import {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Ingredient, ShoppingItem, MealPlan, Recipe } from '../types';
import { getUserHouseholdId } from './householdService';

// Collection names
const COLLECTIONS = {
    userData: 'userData',
    householdData: 'householdData',
} as const;

export interface UserData {
    pantry: Ingredient[];
    shoppingLists: {
        items: ShoppingItem[];
        lastUpdated: string;
    };
    mealPlans: MealPlan[];
    favorites: string[];
    recipes: Recipe[];
    settings: {
        theme?: 'dark' | 'light';
        notifications?: boolean;
    };
    lastSynced?: string;
}



// Get document ref synchronously (for subscriptions - uses cached value)
let cachedHouseholdId: string | null | undefined = undefined;

export function setCachedHouseholdId(id: string | null) {
    cachedHouseholdId = id;
}

// Unified Get Data Doc Ref - Trusts the cache first
async function getDataDocRef(userId: string) {
    // 1. Hot Path: Use cache if we've already resolved the context
    if (cachedHouseholdId !== undefined) {
        if (cachedHouseholdId) {
            return doc(db, COLLECTIONS.householdData, cachedHouseholdId);
        }
        return doc(db, COLLECTIONS.userData, userId);
    }

    // 2. Cold Path: Fetch from DB (Only happens if authStore hasn't initialized us properly)
    // This should ideally rarely happen if authStore flow is correct
    console.warn('SyncService: Cold fetch of household ID triggered. This should be rare.');
    const householdId = await getUserHouseholdId(userId);
    setCachedHouseholdId(householdId); // Cache it for future consistency

    if (householdId) {
        return doc(db, COLLECTIONS.householdData, householdId);
    }
    return doc(db, COLLECTIONS.userData, userId);
}

function getDataDocRefSync(userId: string) {
    if (cachedHouseholdId) {
        return doc(db, COLLECTIONS.householdData, cachedHouseholdId);
    }
    return doc(db, COLLECTIONS.userData, userId);
}

// Save user data to Firestore
export async function saveUserData(userId: string, data: Partial<UserData>): Promise<void> {
    const docRef = await getDataDocRef(userId);

    try {
        await setDoc(
            docRef,
            {
                ...data,
                lastSynced: serverTimestamp(),
            },
            { merge: true }
        );
    } catch (error) {
        console.error('Error saving user data:', error);
        throw error;
    }
}

// Load user data from Firestore
export async function loadUserData(userId: string): Promise<UserData | null> {
    const docRef = await getDataDocRef(userId);

    try {
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as UserData;
        }
        return null;
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

// Subscribe to real-time updates
export function subscribeToUserData(
    userId: string,
    callback: (data: UserData | null) => void
): Unsubscribe {
    const docRef = getDataDocRefSync(userId);

    return onSnapshot(
        docRef,
        (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data() as UserData);
            } else {
                callback(null);
            }
        },
        (error) => {
            console.error('Error subscribing to user data:', error);
            callback(null);
        }
    );
}

// Debounce utility to prevent write spam
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Sync specific store data - Debounced individually to avoid conflicts
// Debounce time: reduced to 500ms for snappier saves and less data loss risk on reload
const DEBOUNCE_MS = 500;

export const syncPantry = debounce((userId: string, ingredients: Ingredient[]) => {
    // syncService uses cachedHouseholdId internally to route to correct doc
    saveUserData(userId, { pantry: ingredients })
        .catch(err => console.error('SYNC PANTRY FAILED:', err)); // Explicit log
}, DEBOUNCE_MS);

export const syncShoppingList = debounce((userId: string, items: ShoppingItem[]) => {
    saveUserData(userId, {
        shoppingLists: {
            items,
            lastUpdated: new Date().toISOString(),
        },
    }).catch(console.error);
}, DEBOUNCE_MS);

export const syncMealPlans = debounce((userId: string, mealPlans: MealPlan[]) => {
    saveUserData(userId, { mealPlans }).catch(console.error);
}, DEBOUNCE_MS);

export const syncFavorites = debounce((userId: string, favorites: string[]) => {
    saveUserData(userId, { favorites }).catch(console.error);
}, DEBOUNCE_MS);

export const syncRecipes = debounce((userId: string, recipes: Recipe[]) => {
    saveUserData(userId, { recipes }).catch(console.error);
}, DEBOUNCE_MS);
