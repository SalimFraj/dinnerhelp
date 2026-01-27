import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    requestNotificationPermission,
    checkExpiringIngredients,
    showLocalNotification,
    onForegroundMessage,
} from '../services/notificationService';
import { usePantryStore } from './pantryStore';

interface NotificationState {
    isEnabled: boolean;
    fcmToken: string | null;
    lastChecked: string | null;
    expirationReminders: boolean;
    mealReminders: boolean;

    // Actions
    enableNotifications: () => Promise<boolean>;
    disableNotifications: () => void;
    setExpirationReminders: (enabled: boolean) => void;
    setMealReminders: (enabled: boolean) => void;
    checkForExpirations: () => void;
    initializeForegroundListener: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            isEnabled: false,
            fcmToken: null,
            lastChecked: null,
            expirationReminders: true,
            mealReminders: true,

            enableNotifications: async () => {
                const token = await requestNotificationPermission();
                if (token) {
                    set({
                        isEnabled: true,
                        fcmToken: token,
                    });

                    // Initialize foreground listener
                    get().initializeForegroundListener();

                    return true;
                }
                return false;
            },

            disableNotifications: () => {
                set({
                    isEnabled: false,
                    fcmToken: null,
                });
            },

            setExpirationReminders: (enabled) => {
                set({ expirationReminders: enabled });
            },

            setMealReminders: (enabled) => {
                set({ mealReminders: enabled });
            },

            checkForExpirations: () => {
                const { isEnabled, expirationReminders } = get();
                if (!isEnabled || !expirationReminders) return;

                const pantryState = usePantryStore.getState();
                const notifications = checkExpiringIngredients(pantryState.ingredients);

                // Only show once per day per ingredient
                const lastChecked = get().lastChecked;
                const today = new Date().toDateString();

                if (lastChecked !== today) {
                    notifications.forEach((notification) => {
                        showLocalNotification(notification);
                    });
                    set({ lastChecked: today });
                }
            },

            initializeForegroundListener: () => {
                onForegroundMessage((payload) => {
                    if (payload.notification) {
                        showLocalNotification({
                            title: payload.notification.title || 'DinnerHelp',
                            body: payload.notification.body || '',
                        });
                    }
                });
            },
        }),
        {
            name: 'dinnerhelp-notifications',
            partialize: (state) => ({
                isEnabled: state.isEnabled,
                expirationReminders: state.expirationReminders,
                mealReminders: state.mealReminders,
            }),
        }
    )
);
