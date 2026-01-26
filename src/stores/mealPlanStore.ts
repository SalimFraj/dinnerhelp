import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MealPlan } from '../types';

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
                set((state) => ({
                    mealPlans: [
                        ...state.mealPlans.filter(
                            (p) => !(p.date === plan.date && p.mealType === plan.mealType)
                        ),
                        newPlan,
                    ],
                }));
            },

            updateMealPlan: (id, updates) => {
                set((state) => ({
                    mealPlans: state.mealPlans.map((plan) =>
                        plan.id === id ? { ...plan, ...updates } : plan
                    ),
                }));
            },

            removeMealPlan: (id) => {
                set((state) => ({
                    mealPlans: state.mealPlans.filter((p) => p.id !== id),
                }));
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

                set((state) => ({
                    mealPlans: state.mealPlans.filter((p) => {
                        const planDate = new Date(p.date);
                        return planDate < start || planDate >= end;
                    }),
                }));
            },
        }),
        {
            name: 'dinnerhelp-mealplan',
        }
    )
);
