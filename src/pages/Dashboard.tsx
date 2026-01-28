import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChefHat,
    ShoppingBasket,
    Sparkles,
    Calendar,
    ArrowRight,
    TrendingUp,
    AlertTriangle,
    MessageCircle,
    User,
    LogIn
} from 'lucide-react';
import { usePantryStore, useRecipeStore, useMealPlanStore } from '../stores';
import { useAuthStore } from '../stores/authStore';
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
    const navigate = useNavigate();
    const { ingredients } = usePantryStore();
    const { getFavorites } = useRecipeStore();
    const { mealPlans } = useMealPlanStore();
    const { user } = useAuthStore();

    const favorites = getFavorites();
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = mealPlans.filter(p => p.date === today);

    // Get expiring ingredients (within 3 days)
    const expiringIngredients = ingredients.filter(ing => {
        if (!ing.expirationDate) return false;
        const daysUntil = Math.ceil(
            (new Date(ing.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 3 && daysUntil >= 0;
    });

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

                    {/* User Button */}
                    <button
                        className="hero-user-btn"
                        onClick={() => navigate('/auth')}
                        title={user ? user.displayName || user.email || 'Account' : 'Sign In'}
                    >
                        {user ? (
                            user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="hero-user-avatar" />
                            ) : (
                                <User size={20} />
                            )
                        ) : (
                            <LogIn size={20} />
                        )}
                    </button>

                    <div className="hero-glow" />
                </motion.header>

                {/* AI Chat CTA - Primary Action */}
                <motion.section variants={item} className="dashboard-section">
                    <Link to="/chat" className="ai-chat-cta">
                        <div className="ai-chat-content">
                            <div className="ai-chat-icon">
                                <Sparkles size={28} />
                            </div>
                            <div className="ai-chat-text">
                                <h3>Ask AI for dinner ideas</h3>
                                <p>Get personalized suggestions based on your pantry</p>
                            </div>
                        </div>
                        <ArrowRight size={24} className="ai-chat-arrow" />
                    </Link>
                </motion.section>

                {/* Expiring Ingredients Alert */}
                {expiringIngredients.length > 0 && (
                    <motion.section variants={item} className="dashboard-section">
                        <div className="expiring-alert">
                            <div className="expiring-header">
                                <AlertTriangle size={20} className="expiring-icon" />
                                <span className="expiring-title">
                                    {expiringIngredients.length} item{expiringIngredients.length > 1 ? 's' : ''} expiring soon
                                </span>
                            </div>
                            <div className="expiring-items">
                                {expiringIngredients.slice(0, 3).map(ing => (
                                    <span key={ing.id} className="expiring-item">{ing.name}</span>
                                ))}
                                {expiringIngredients.length > 3 && (
                                    <span className="expiring-more">+{expiringIngredients.length - 3} more</span>
                                )}
                            </div>
                            <Link to="/chat" className="expiring-action">
                                Ask AI what to cook →
                            </Link>
                        </div>
                    </motion.section>
                )}

                {/* Quick Actions */}
                <motion.section variants={item} className="dashboard-section">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="quick-actions">
                        <Link to="/recipes" className="quick-action">
                            <div className="quick-action-icon">
                                <ChefHat size={24} />
                            </div>
                            <div className="quick-action-content">
                                <h3>Browse Recipes</h3>
                                <p>Discover new dishes</p>
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
                            <MessageCircle size={20} />
                        </div>
                        <div className="tip-content">
                            <h4>Pro Tip</h4>
                            <p>Tap the ✨ button to ask AI for dinner ideas based on what you have!</p>
                        </div>
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}
