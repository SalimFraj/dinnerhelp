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

// Collection names
const COLLECTIONS = {
    userData: 'userData',
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

// Save user data to Firestore
export async function saveUserData(userId: string, data: Partial<UserData>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.userData, userId);

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
    const docRef = doc(db, COLLECTIONS.userData, userId);

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
    const docRef = doc(db, COLLECTIONS.userData, userId);

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

// Sync specific store data
export async function syncPantry(userId: string, ingredients: Ingredient[]): Promise<void> {
    await saveUserData(userId, { pantry: ingredients });
}

export async function syncShoppingList(userId: string, items: ShoppingItem[]): Promise<void> {
    await saveUserData(userId, {
        shoppingLists: {
            items,
            lastUpdated: new Date().toISOString(),
        },
    });
}

export async function syncMealPlans(userId: string, mealPlans: MealPlan[]): Promise<void> {
    await saveUserData(userId, { mealPlans });
}

export async function syncFavorites(userId: string, favorites: string[]): Promise<void> {
    await saveUserData(userId, { favorites });
}

export async function syncRecipes(userId: string, recipes: Recipe[]): Promise<void> {
    await saveUserData(userId, { recipes });
}
