import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Check,
    Trash2,
    ShoppingCart,
    History,
    DollarSign,
    Copy
} from 'lucide-react';
import { useShoppingStore, useUIStore } from '../stores';
import type { ShoppingCategory } from '../types';
import './Shopping.css';

const categoryLabels: Record<ShoppingCategory, string> = {
    produce: '🥬 Produce',
    meat: '🥩 Meat',
    dairy: '🥛 Dairy',
    bakery: '🍞 Bakery',
    frozen: '❄️ Frozen',
    pantry: '🥫 Pantry',
    beverages: '🥤 Beverages',
    household: '🧹 Household',
    other: '📦 Other',
};

const categoryOrder: ShoppingCategory[] = [
    'produce', 'bakery', 'dairy', 'meat', 'frozen', 'pantry', 'beverages', 'household', 'other'
];

export default function Shopping() {
    const {
        lists,
        activeListId,
        createList,
        setActiveList,
        toggleItemChecked,
        removeItem,
        clearCheckedItems,
        addItem,
        getActiveList
    } = useShoppingStore();
    const { addToast } = useUIStore();

    const [showAddItem, setShowAddItem] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const activeList = getActiveList();

    // Group items by category
    const groupedItems = useMemo(() => {
        if (!activeList) return {};

        const grouped: Partial<Record<ShoppingCategory, typeof activeList.items>> = {};

        activeList.items.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category]!.push(item);
        });

        return grouped;
    }, [activeList]);

    // Stats
    const stats = useMemo(() => {
        if (!activeList) return { total: 0, checked: 0, estimated: 0 };

        return {
            total: activeList.items.length,
            checked: activeList.items.filter(i => i.checked).length,
            estimated: activeList.items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0),
        };
    }, [activeList]);

    const handleCreateList = () => {
        const name = `Shopping ${new Date().toLocaleDateString()}`;
        createList(name);
        addToast({ type: 'success', message: 'New list created' });
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim() || !activeListId) return;

        addItem(activeListId, {
            name: newItemName.trim(),
            category: 'other',
            quantity: 1,
            unit: 'unit',
            checked: false,
        });

        setNewItemName('');
        setShowAddItem(false);
        addToast({ type: 'success', message: `Added ${newItemName}` });
    };

    const handleClearChecked = () => {
        if (!activeListId) return;
        clearCheckedItems(activeListId);
        addToast({ type: 'success', message: 'Cleared checked items' });
    };

    const handleShare = async () => {
        if (!activeList) return;

        const text = Object.entries(groupedItems)
            .map(([cat, items]) => {
                const categoryLabel = categoryLabels[cat as ShoppingCategory] || cat;
                const itemsList = items!.map(i =>
                    `${i.checked ? '✓' : '○'} ${i.name}${i.quantity > 1 ? ` (${i.quantity})` : ''}`
                ).join('\n');
                return `${categoryLabel}\n${itemsList}`;
            })
            .join('\n\n');

        try {
            await navigator.clipboard.writeText(text);
            addToast({ type: 'success', message: 'List copied to clipboard!' });
        } catch {
            addToast({ type: 'error', message: 'Failed to copy list' });
        }
    };

    return (
        <div className="page shopping-page">
            <header className="page-header">
                <h1 className="page-title">Shopping</h1>
                <div className="header-actions">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        <History size={20} />
                    </button>
                </div>
            </header>

            {/* Stats Bar */}
            {activeList && activeList.items.length > 0 && (
                <div className="shopping-stats">
                    <div className="stat">
                        <ShoppingCart size={16} />
                        <span>{stats.checked}/{stats.total} items</span>
                    </div>
                    {stats.estimated > 0 && (
                        <div className="stat">
                            <DollarSign size={16} />
                            <span>~${stats.estimated.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="stat-progress">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${(stats.checked / stats.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* List Actions */}
            {activeList && (
                <div className="list-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddItem(true)}
                    >
                        <Plus size={18} />
                        Add Item
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleShare}
                    >
                        <Copy size={18} />
                        Copy List
                    </button>
                    {stats.checked > 0 && (
                        <button
                            className="btn btn-ghost"
                            onClick={handleClearChecked}
                        >
                            <Trash2 size={18} />
                            Clear Done
                        </button>
                    )}
                </div>
            )}

            {/* Add Item Form */}
            <AnimatePresence>
                {showAddItem && (
                    <motion.form
                        className="add-item-form"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAddItem}
                    >
                        <input
                            type="text"
                            className="input"
                            placeholder="Item name..."
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary">Add</button>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setShowAddItem(false)}
                        >
                            Cancel
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Shopping List */}
            <div className="shopping-list">
                {!activeList ? (
                    <div className="empty-state">
                        <ShoppingCart size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">No shopping list</h3>
                        <p className="empty-state-text">
                            Create a list or add items from recipes
                        </p>
                        <button className="btn btn-primary" onClick={handleCreateList}>
                            <Plus size={18} />
                            New List
                        </button>
                    </div>
                ) : activeList.items.length === 0 ? (
                    <div className="empty-state">
                        <ShoppingCart size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">List is empty</h3>
                        <p className="empty-state-text">
                            Add items manually or from recipe ingredients
                        </p>
                    </div>
                ) : (
                    categoryOrder.map(category => {
                        const items = groupedItems[category];
                        if (!items || items.length === 0) return null;

                        return (
                            <motion.section
                                key={category}
                                className="shopping-category"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h2 className="category-header">{categoryLabels[category]}</h2>
                                <div className="items-list">
                                    <AnimatePresence mode="popLayout">
                                        {items.map(item => (
                                            <motion.div
                                                key={item.id}
                                                className={`shopping-item ${item.checked ? 'checked' : ''}`}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20, height: 0 }}
                                                onClick={() => toggleItemChecked(activeListId!, item.id)}
                                            >
                                                <div className={`item-checkbox ${item.checked ? 'checked' : ''}`}>
                                                    {item.checked && <Check size={14} />}
                                                </div>
                                                <span className="item-name">{item.name}</span>
                                                {item.quantity > 1 && (
                                                    <span className="item-quantity">×{item.quantity}</span>
                                                )}
                                                <button
                                                    className="item-delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeItem(activeListId!, item.id);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.section>
                        );
                    })
                )}
            </div>

            {/* History Panel */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        className="history-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                    >
                        <div className="history-header">
                            <h3>Past Lists</h3>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => setShowHistory(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="history-list">
                            {lists.filter(l => l.id !== activeListId).length === 0 ? (
                                <p className="no-history">No previous lists</p>
                            ) : (
                                lists.filter(l => l.id !== activeListId).map(list => (
                                    <button
                                        key={list.id}
                                        className="history-item"
                                        onClick={() => {
                                            setActiveList(list.id);
                                            setShowHistory(false);
                                        }}
                                    >
                                        <span className="history-name">{list.name}</span>
                                        <span className="history-count">{list.items.length} items</span>
                                    </button>
                                ))
                            )}
                        </div>
                        <button className="btn btn-primary w-full" onClick={handleCreateList}>
                            <Plus size={18} />
                            New List
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
