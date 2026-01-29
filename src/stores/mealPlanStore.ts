import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MealPlan } from '../types';
import { syncMealPlans } from '../services/syncService';
import { useAuthStore } from './authStore';

interface MealPlanState {
    mealPlans: MealPlan[];

    addMealPlan: (plan: Omit<MealPlan, 'id'>) => void;
    updateMealPlan: (id: string, updates: Partial<MealPlan>) => void;
    removeMealPlan: (id: string) => void;
    getMealsForDate: (date: string) => MealPlan[];
    getMealsForWeek: (startDate: string) => MealPlan[];
    clearWeek: (startDate: string) => void;
}

export const useMealPlanStore = create<MealPlanState>()(
    persist(
        (set, get) => ({
            mealPlans: [],

            addMealPlan: (plan) => {
                const newPlan: MealPlan = {
                    ...plan,
                    id: crypto.randomUUID(),
                };

                // Remove existing meal for same date/type
                set((state) => {
                    const params = {
                        mealPlans: [
                            ...state.mealPlans.filter(
                                (p) => !(p.date === plan.date && p.mealType === plan.mealType)
                            ),
                            newPlan,
                        ],
                    };
                    const user = useAuthStore.getState().user;
                    if (user) syncMealPlans(user.uid, params.mealPlans);
                    return params;
                });
            },

            updateMealPlan: (id, updates) => {
                set((state) => {
                    const params = {
                        mealPlans: state.mealPlans.map((plan) =>
                            plan.id === id ? { ...plan, ...updates } : plan
                        ),
                    };
                    const user = useAuthStore.getState().user;
                    if (user) syncMealPlans(user.uid, params.mealPlans);
                    return params;
                });
            },

            removeMealPlan: (id) => {
                set((state) => {
                    const params = {
                        mealPlans: state.mealPlans.filter((p) => p.id !== id),
                    };
                    const user = useAuthStore.getState().user;
                    if (user) syncMealPlans(user.uid, params.mealPlans);
                    return params;
                });
            },

            getMealsForDate: (date) => {
                return get().mealPlans.filter((p) => p.date === date);
            },

            getMealsForWeek: (startDate) => {
                const start = new Date(startDate);
                const end = new Date(start);
                end.setDate(end.getDate() + 7);

                return get().mealPlans.filter((p) => {
                    const planDate = new Date(p.date);
                    return planDate >= start && planDate < end;
                });
            },

            clearWeek: (startDate) => {
                const start = new Date(startDate);
                const end = new Date(start);
                end.setDate(end.getDate() + 7);

                set((state) => {
                    const params = {
                        mealPlans: state.mealPlans.filter((p) => {
                            const planDate = new Date(p.date);
                            return planDate < start || planDate >= end;
                        }),
                    };
                    const user = useAuthStore.getState().user;
                    if (user) syncMealPlans(user.uid, params.mealPlans);
                    return params;
                });
            },
        }),
        {
            name: 'dinnerhelp-mealplan',
        }
    )
);
