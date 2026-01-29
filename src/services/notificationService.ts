import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export interface NotificationData {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
    try {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        const messaging = await getMessagingInstance();
        if (!messaging) {
            console.log('Messaging not supported');
            return null;
        }

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
    let unsubscribe = () => { };

    getMessagingInstance().then((messaging) => {
        if (messaging) {
            unsubscribe = onMessage(messaging, callback);
        }
    });

    return () => unsubscribe();
}

// Show a local notification (for testing or fallback)
export function showLocalNotification(data: NotificationData): void {
    if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
    }

    const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        tag: data.tag,
        requireInteraction: false,
    });

    if (data.url) {
        notification.onclick = () => {
            window.focus();
            window.location.href = data.url!;
            notification.close();
        };
    }
}

// Schedule expiration notifications (runs client-side)
export function checkExpiringIngredients(
    ingredients: { name: string; expirationDate?: string | null }[]
): NotificationData[] {
    const notifications: NotificationData[] = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    ingredients.forEach((ingredient) => {
        if (!ingredient.expirationDate) return;

        const expiryDate = new Date(ingredient.expirationDate).getTime();
        const daysUntil = Math.ceil((expiryDate - now) / oneDayMs);

        if (daysUntil === 0) {
            notifications.push({
                title: '⚠️ Expires Today!',
                body: `${ingredient.name} expires today. Use it now!`,
                tag: `expire-${ingredient.name}`,
                url: '/pantry',
            });
        } else if (daysUntil === 1) {
            notifications.push({
                title: '🕐 Expires Tomorrow',
                body: `${ingredient.name} expires tomorrow.`,
                tag: `expire-${ingredient.name}`,
                url: '/pantry',
            });
        } else if (daysUntil === 3) {
            notifications.push({
                title: '📅 Expiring Soon',
                body: `${ingredient.name} expires in 3 days.`,
                tag: `expire-${ingredient.name}`,
                url: '/pantry',
            });
        }
    });

    return notifications;
}

// Meal reminder notifications
export function getMealReminderNotification(
    mealType: 'breakfast' | 'lunch' | 'dinner',
    recipeName?: string
): NotificationData {
    return {
        title: `🍽️ Time for ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}!`,
        body: recipeName
            ? `Your planned meal: ${recipeName}`
            : `Check your meal plan for today's ${mealType}.`,
        tag: `meal-${mealType}`,
        url: '/meal-plan',
    };
}
