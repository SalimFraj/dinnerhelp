import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Save } from 'lucide-react';
import { usePantryStore, useUIStore } from '../../stores';
import type { Ingredient, IngredientCategory } from '../../types';
import './AddIngredientModal.css';

interface Props {
    ingredient?: Ingredient | null;
    onClose: () => void;
}

const categories: { value: IngredientCategory; label: string }[] = [
    { value: 'produce', label: '🥬 Produce' },
    { value: 'meat', label: '🥩 Meat & Seafood' },
    { value: 'dairy', label: '🥛 Dairy' },
    { value: 'grains', label: '🌾 Grains & Bread' },
    { value: 'canned', label: '🥫 Canned Goods' },
    { value: 'frozen', label: '❄️ Frozen' },
    { value: 'spices', label: '🧂 Spices' },
    { value: 'condiments', label: '🍯 Condiments' },
    { value: 'beverages', label: '🥤 Beverages' },
    { value: 'snacks', label: '🍿 Snacks' },
    { value: 'other', label: '📦 Other' },
];

const commonUnits = ['unit', 'lb', 'oz', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'can', 'bottle', 'bag', 'box'];

export default function AddIngredientModal({ ingredient, onClose }: Props) {
    const { addIngredient, updateIngredient } = usePantryStore();
    const { addToast } = useUIStore();

    const [name, setName] = useState(ingredient?.name || '');
    const [quantity, setQuantity] = useState(ingredient?.quantity?.toString() || '1');
    const [unit, setUnit] = useState(ingredient?.unit || 'unit');
    const [category, setCategory] = useState<IngredientCategory>(ingredient?.category || 'other');
    const [expirationDate, setExpirationDate] = useState(ingredient?.expirationDate || '');

    const isEditing = !!ingredient;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            addToast({ type: 'error', message: 'Please enter an ingredient name' });
            return;
        }

        const data = {
            name: name.trim(),
            quantity: parseFloat(quantity) || 1,
            unit,
            category,
            expirationDate: expirationDate || undefined,
        };

        if (isEditing) {
            updateIngredient(ingredient.id, data);
            addToast({ type: 'success', message: `Updated ${name}` });
        } else {
            addIngredient(data);
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
                                {commonUnits.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="input-group">
                        <label className="input-label">Category</label>
                        <select
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as IngredientCategory)}
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
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
