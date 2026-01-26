import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home,
    ShoppingBasket,
    UtensilsCrossed,
    ShoppingCart,
    Calendar,
    Mic
} from 'lucide-react';
import { useUIStore } from '../stores';
import Toast from './ui/Toast';
import VoiceModal from './voice/VoiceModal';
import './Layout.css';

const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/pantry', icon: ShoppingBasket, label: 'Pantry' },
    { path: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
    { path: '/shopping', icon: ShoppingCart, label: 'Shop' },
    { path: '/meal-plan', icon: Calendar, label: 'Plan' },
];

export default function Layout() {
    const location = useLocation();
    const { toasts, isVoiceListening, setVoiceListening } = useUIStore();

    return (
        <div className="layout">
            <main className="layout-main">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <Outlet />
                </motion.div>
            </main>

            {/* Voice FAB */}
            <button
                className={`fab voice-fab ${isVoiceListening ? 'listening' : ''}`}
                onClick={() => setVoiceListening(true)}
                aria-label="Voice command"
            >
                <Mic size={24} />
                {isVoiceListening && <span className="voice-pulse" />}
            </button>

            {/* Bottom Navigation */}
            <nav className="nav-bottom">
                <ul className="nav-bottom-list">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <li key={path} className="nav-bottom-item">
                            <NavLink
                                to={path}
                                className={({ isActive }) =>
                                    `nav-bottom-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <Icon size={22} />
                                <span className="nav-bottom-label">{label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </div>

            {/* Voice Modal */}
            {isVoiceListening && <VoiceModal />}
        </div>
    );
}
