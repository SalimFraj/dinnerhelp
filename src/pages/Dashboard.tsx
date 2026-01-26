import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ChefHat,
    ShoppingBasket,
    Sparkles,
    Calendar,
    ArrowRight,
    Clock,
    TrendingUp
} from 'lucide-react';
import { usePantryStore, useRecipeStore, useMealPlanStore } from '../stores';
import './Dashboard.css';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
    const { ingredients } = usePantryStore();
    const { getFavorites } = useRecipeStore();
    const { mealPlans } = useMealPlanStore();

    const favorites = getFavorites();
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = mealPlans.filter(p => p.date === today);

    // Get greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="page dashboard">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="dashboard-content"
            >
                {/* Hero Section */}
                <motion.header variants={item} className="dashboard-hero">
                    <div className="hero-content">
                        <div className="hero-icon">
                            <ChefHat size={32} />
                        </div>
                        <h1 className="hero-title">{greeting}! 👋</h1>
                        <p className="hero-subtitle">What's cooking today?</p>
                    </div>
                    <div className="hero-glow" />
                </motion.header>

                {/* Quick Actions */}
                <motion.section variants={item} className="dashboard-section">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="quick-actions">
                        <Link to="/recipes" className="quick-action quick-action-primary">
                            <div className="quick-action-icon">
                                <Sparkles size={24} />
                            </div>
                            <div className="quick-action-content">
                                <h3>Get Suggestions</h3>
                                <p>AI-powered recipes from your pantry</p>
                            </div>
                            <ArrowRight size={20} className="quick-action-arrow" />
                        </Link>

                        <Link to="/pantry" className="quick-action">
                            <div className="quick-action-icon">
                                <ShoppingBasket size={24} />
                            </div>
                            <div className="quick-action-content">
                                <h3>Update Pantry</h3>
                                <p>{ingredients.length} items</p>
                            </div>
                            <ArrowRight size={20} className="quick-action-arrow" />
                        </Link>
                    </div>
                </motion.section>

                {/* Stats Cards */}
                <motion.section variants={item} className="dashboard-section">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon stat-icon-orange">
                                <ShoppingBasket size={20} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{ingredients.length}</span>
                                <span className="stat-label">Pantry Items</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon stat-icon-pink">
                                <TrendingUp size={20} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{favorites.length}</span>
                                <span className="stat-label">Favorites</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon stat-icon-blue">
                                <Calendar size={20} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{todaysMeals.length}</span>
                                <span className="stat-label">Today's Meals</span>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Today's Plan */}
                {todaysMeals.length > 0 && (
                    <motion.section variants={item} className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">Today's Menu</h2>
                            <Link to="/meal-plan" className="section-link">View all</Link>
                        </div>
                        <div className="today-meals">
                            {todaysMeals.map((meal) => (
                                <div key={meal.id} className="today-meal-card">
                                    <span className="meal-type-badge">{meal.mealType}</span>
                                    <span className="meal-name">{meal.recipe?.title || 'Recipe'}</span>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Empty State for new users */}
                {ingredients.length === 0 && (
                    <motion.section variants={item} className="dashboard-empty">
                        <div className="empty-illustration">
                            <div className="empty-circle">
                                <ShoppingBasket size={48} />
                            </div>
                        </div>
                        <h3>Your pantry is empty</h3>
                        <p>Start by adding ingredients to get personalized recipe suggestions</p>
                        <Link to="/pantry" className="btn btn-primary btn-lg">
                            Add Ingredients
                        </Link>
                    </motion.section>
                )}

                {/* Tips Card */}
                <motion.section variants={item} className="dashboard-section">
                    <div className="tip-card">
                        <div className="tip-icon">
                            <Clock size={20} />
                        </div>
                        <div className="tip-content">
                            <h4>Pro Tip</h4>
                            <p>Use voice commands! Tap the microphone and say "Add chicken" to quickly update your pantry.</p>
                        </div>
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}
