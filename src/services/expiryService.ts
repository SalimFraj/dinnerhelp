import type { Ingredient } from '../types';

// Map of common items to shelf life in days (refrigerated/pantry)
const SHELF_LIFE_DAYS: Record<string, number> = {
    // Dairy
    'milk': 7,
    'eggs': 21,
    'yogurt': 14,
    'cheese': 21,
    'butter': 90,
    'cream': 10,

    // Produce
    'lettuce': 5,
    'spinach': 5,
    'kale': 5,
    'salad': 3,
    'tomato': 7,
    'avocado': 3,
    'banana': 5,
    'apple': 14,
    'grapes': 7,
    'berries': 3,
    'strawberry': 3,
    'blueberry': 5,
    'carrot': 21,
    'potato': 30,
    'onion': 30,
    'cucumber': 5,
    'pepper': 7,
    'mushroom': 5,
    'broccoli': 5,

    // Meat
    'chicken': 3,
    'beef': 3,
    'pork': 3,
    'fish': 2,
    'salmon': 2,
    'tuna': 2,
    'ground': 2,
    'steak': 3,

    // Bakery
    'bread': 5,
    'bagels': 5,
    'tortilla': 14,
    'bun': 5,

    // Default by category (lower case keys)
    'produce': 5,
    'meat': 3,
    'dairy': 10,
    'bakery': 7,
    'frozen': 180,
    'canned': 365,
    'pantry': 180,
    'spices': 365,
    'beverages': 30,
};

export function getEstimatedShelfLife(name: string, category: string): number {
    const lowerName = name.toLowerCase();

    // Check specific items matches
    for (const [key, days] of Object.entries(SHELF_LIFE_DAYS)) {
        if (lowerName.includes(key) && !['produce', 'meat', 'dairy', 'bakery', 'frozen', 'canned', 'pantry', 'spices'].includes(key)) {
            return days;
        }
    }

    // Fallback to category
    const categoryKey = category.toLowerCase();
    return SHELF_LIFE_DAYS[categoryKey] || 14; // Default 2 weeks if unknown
}

export function getDaysUntilExpiration(ingredient: Ingredient): number {
    const now = Date.now();

    if (ingredient.expirationDate) {
        const expiry = new Date(ingredient.expirationDate).getTime();
        return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    }

    const added = new Date(ingredient.addedAt || new Date().toISOString()).getTime();
    const shelfLife = getEstimatedShelfLife(ingredient.name, ingredient.category);
    const estimatedExpiry = added + (shelfLife * 24 * 60 * 60 * 1000);

    return Math.ceil((estimatedExpiry - now) / (1000 * 60 * 60 * 24));
}

export interface ExpiryStatus {
    daysLeft: number;
    status: 'expired' | 'critical' | 'warning' | 'good';
    isEstimated: boolean;
    color: string;
    label: string;
}

export function getExpiryStatus(ingredient: Ingredient): ExpiryStatus {
    const daysLeft = getDaysUntilExpiration(ingredient);
    let status: ExpiryStatus['status'] = 'good';
    let color = 'var(--success-color)';
    let label = 'Fresh';

    if (daysLeft < 0) {
        status = 'expired';
        color = 'var(--error-color)';
        label = 'Expired';
    } else if (daysLeft === 0) {
        status = 'critical';
        color = 'var(--error-color)';
        label = 'Today';
    } else if (daysLeft <= 2) {
        status = 'critical';
        color = 'var(--error-color)';
        label = `${daysLeft} days`;
    } else if (daysLeft <= 5) {
        status = 'warning';
        color = 'var(--warning-color)';
        label = `${daysLeft} days`;
    } else {
        label = `${daysLeft} days`;
    }

    return {
        daysLeft,
        status,
        isEstimated: !ingredient.expirationDate,
        color,
        label
    };
}
