import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Scan,
    Camera,
    Trash2,
    Edit2,
    Package,
    AlertTriangle
} from 'lucide-react';
import { usePantryStore, useUIStore } from '../stores';
import type { Ingredient, IngredientCategory } from '../types';
import AddIngredientModal from '../components/pantry/AddIngredientModal';
import BarcodeScanner from '../components/pantry/BarcodeScanner';
import ReceiptScanner from '../components/pantry/ReceiptScanner';
import './Pantry.css';

const categoryLabels: Record<IngredientCategory, string> = {
    produce: '🥬 Produce',
    meat: '🥩 Meat & Seafood',
    dairy: '🥛 Dairy',
    grains: '🌾 Grains & Bread',
    canned: '🥫 Canned Goods',
    frozen: '❄️ Frozen',
    spices: '🧂 Spices',
    condiments: '🍯 Condiments',
    beverages: '🥤 Beverages',
    snacks: '🍿 Snacks',
    other: '📦 Other',
};

const categoryOrder: IngredientCategory[] = [
    'produce', 'meat', 'dairy', 'grains', 'canned',
    'frozen', 'spices', 'condiments', 'beverages', 'snacks', 'other'
];

export default function Pantry() {
    const { ingredients, removeIngredient } = usePantryStore();
    const { addToast } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    // Group and filter ingredients
    const groupedIngredients = useMemo(() => {
        const filtered = ingredients.filter(ing =>
            ing.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const grouped: Partial<Record<IngredientCategory, Ingredient[]>> = {};

        filtered.forEach(ing => {
            if (!grouped[ing.category]) {
                grouped[ing.category] = [];
            }
            grouped[ing.category]!.push(ing);
        });

        return grouped;
    }, [ingredients, searchQuery]);

    const handleDelete = (id: string, name: string) => {
        removeIngredient(id);
        addToast({ type: 'success', message: `Removed ${name}` });
    };

    const isExpiringSoon = (date?: string) => {
        if (!date) return false;
        const expDate = new Date(date);
        const today = new Date();
        const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 3 && daysUntil >= 0;
    };

    const isExpired = (date?: string) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    return (
        <div className="page pantry">
            <header className="page-header">
                <h1 className="page-title">My Pantry</h1>
                <span className="ingredient-count">{ingredients.length} items</span>
            </header>

            {/* Search Bar */}
            <div className="pantry-search">
                <div className="input-with-icon">
                    <Search size={20} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search ingredients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Add Methods */}
            <div className="add-methods">
                <button
                    className="add-method-btn add-method-primary"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus size={20} />
                    <span>Add</span>
                </button>
                <button
                    className="add-method-btn"
                    onClick={() => setIsBarcodeOpen(true)}
                >
                    <Scan size={20} />
                    <span>Scan</span>
                </button>
                <button
                    className="add-method-btn"
                    onClick={() => setIsReceiptOpen(true)}
                >
                    <Camera size={20} />
                    <span>Receipt</span>
                </button>
            </div>

            {/* Ingredients List */}
            <div className="pantry-list">
                {ingredients.length === 0 ? (
                    <div className="empty-state">
                        <Package size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">No ingredients yet</h3>
                        <p className="empty-state-text">
                            Add ingredients to see recipe suggestions based on what you have
                        </p>
                    </div>
                ) : Object.keys(groupedIngredients).length === 0 ? (
                    <div className="empty-state">
                        <Search size={48} className="empty-state-icon" />
                        <h3 className="empty-state-title">No results</h3>
                        <p className="empty-state-text">Try a different search term</p>
                    </div>
                ) : (
                    categoryOrder.map(category => {
                        const items = groupedIngredients[category];
                        if (!items || items.length === 0) return null;

                        return (
                            <motion.section
                                key={category}
                                className="pantry-category"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h2 className="category-title">{categoryLabels[category]}</h2>
                                <div className="ingredient-list">
                                    <AnimatePresence mode="popLayout">
                                        {items.map(ingredient => (
                                            <motion.div
                                                key={ingredient.id}
                                                className={`ingredient-card ${isExpired(ingredient.expirationDate) ? 'expired' : isExpiringSoon(ingredient.expirationDate) ? 'expiring' : ''}`}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="ingredient-info">
                                                    <h3 className="ingredient-name">{ingredient.name}</h3>
                                                    <p className="ingredient-quantity">
                                                        {ingredient.quantity} {ingredient.unit}
                                                    </p>
                                                    {ingredient.expirationDate && (
                                                        <p className={`ingredient-expiry ${isExpired(ingredient.expirationDate) ? 'text-error' : isExpiringSoon(ingredient.expirationDate) ? 'text-warning' : ''}`}>
                                                            {isExpired(ingredient.expirationDate) && <AlertTriangle size={12} />}
                                                            Exp: {new Date(ingredient.expirationDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="ingredient-actions">
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => setEditingIngredient(ingredient)}
                                                        aria-label="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleDelete(ingredient.id, ingredient.name)}
                                                        aria-label="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.section>
                        );
                    })
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {(isAddModalOpen || editingIngredient) && (
                    <AddIngredientModal
                        ingredient={editingIngredient}
                        onClose={() => {
                            setIsAddModalOpen(false);
                            setEditingIngredient(null);
                        }}
                    />
                )}

                {isBarcodeOpen && (
                    <BarcodeScanner onClose={() => setIsBarcodeOpen(false)} />
                )}

                {isReceiptOpen && (
                    <ReceiptScanner onClose={() => setIsReceiptOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
