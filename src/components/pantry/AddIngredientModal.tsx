import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Save, Sparkles } from 'lucide-react';
import { usePantryStore, useUIStore } from '../../stores';
import { actionService } from '../../services/actionService';
import { detectIngredientCategory, suggestUnit, getUnitsForCategory } from '../../services/categorizationService';
import type { Ingredient, IngredientCategory } from '../../types';
import './AddIngredientModal.css';

interface Props {
    ingredient?: Ingredient | null;
    onClose: () => void;
}

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

const commonUnits = ['unit', 'lb', 'oz', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'can', 'bottle', 'bag', 'box', 'pcs', 'gal'];

export default function AddIngredientModal({ ingredient, onClose }: Props) {
    const { updateIngredient } = usePantryStore();
    const { addToast } = useUIStore();

    const [name, setName] = useState(ingredient?.name || '');
    const [quantity, setQuantity] = useState(ingredient?.quantity?.toString() || '1');
    const [unit, setUnit] = useState(ingredient?.unit || '');
    const [expirationDate, setExpirationDate] = useState(ingredient?.expirationDate || '');

    // Auto-detected category
    const [detectedCategory, setDetectedCategory] = useState<IngredientCategory>(ingredient?.category || 'other');

    const isEditing = !!ingredient;

    // Auto-detect category and suggest unit as user types
    useEffect(() => {
        if (name.trim()) {
            const category = detectIngredientCategory(name);
            setDetectedCategory(category);

            // Auto-suggest unit if not already set or if switching categories significantly
            // For now, keep it simple: only suggest if unit is default 'unit' or empty, 
            // OR if we are editing and the user changed the name, they might want a new unit.
            // But let's stick to the requested fix: just enable categorization.
            if (!unit || unit === 'unit') {
                const suggested = suggestUnit(name, category);
                setUnit(suggested);
            }
        }
    }, [name, unit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            addToast({ type: 'error', message: 'Please enter an ingredient name' });
            return;
        }

        if (isEditing) {
            updateIngredient(ingredient.id, {
                name: name.trim(),
                quantity: parseFloat(quantity) || 1,
                unit: unit || 'unit',
                category: detectedCategory,
                expirationDate: expirationDate || undefined,
            });
            addToast({ type: 'success', message: `Updated ${name}` });
        } else {
            // Use smart add for new ingredients
            actionService.addPantryItemSmart(
                name.trim(),
                parseFloat(quantity) || 1,
                unit || undefined, // Unit should probably stay string | undefined unless store handles it
                expirationDate || null as any // Force null for Firestore compatibility if needed, or let store handle it
            );
            addToast({ type: 'success', message: `Added ${name} to pantry` });
        }

        onClose();
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal add-ingredient-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? 'Edit Ingredient' : 'Add Ingredient'}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Name */}
                    <div className="input-group">
                        <label className="input-label">Ingredient Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., Chicken breast"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Auto-detected Category Badge */}
                    {name.trim() && (
                        <div className="detected-category">
                            <Sparkles size={14} />
                            <span>Auto-detected: </span>
                            <span className="category-badge">{categoryLabels[detectedCategory]}</span>
                        </div>
                    )}

                    {/* Quantity and Unit */}
                    <div className="input-row">
                        <div className="input-group">
                            <label className="input-label">Quantity</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                step="0.5"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Unit</label>
                            <select
                                className="input"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            >
                                {((detectedCategory && name.trim())
                                    ? getUnitsForCategory(detectedCategory)
                                    : commonUnits
                                ).map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Expiration Date */}
                    <div className="input-group">
                        <label className="input-label">Expiration Date (Optional)</label>
                        <input
                            type="date"
                            className="input"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? <Save size={18} /> : <Plus size={18} />}
                            {isEditing ? 'Save' : 'Add'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
