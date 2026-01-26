import { motion } from 'framer-motion';
import { X, Clock, Users, ChefHat } from 'lucide-react';
import type { DifficultyLevel } from '../../types';
import './FilterModal.css';

interface Filters {
    maxCookTime: number;
    difficulty: DifficultyLevel | '';
    minServings: number;
    maxServings: number;
}

interface Props {
    filters: Filters;
    onChange: (filters: Filters) => void;
    onClose: () => void;
}

export default function FilterModal({ filters, onChange, onClose }: Props) {
    const handleChange = (key: keyof Filters, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onChange({
            maxCookTime: 120,
            difficulty: '',
            minServings: 1,
            maxServings: 10,
        });
    };

    const hasActiveFilters =
        filters.maxCookTime < 120 ||
        filters.difficulty !== '' ||
        filters.minServings > 1 ||
        filters.maxServings < 10;

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal filter-modal"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">Filters</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Cook Time */}
                    <div className="filter-group">
                        <label className="filter-label">
                            <Clock size={16} />
                            Max Cook Time: {filters.maxCookTime}+ min
                        </label>
                        <input
                            type="range"
                            min="15"
                            max="120"
                            step="15"
                            value={filters.maxCookTime}
                            onChange={(e) => handleChange('maxCookTime', parseInt(e.target.value))}
                            className="filter-range"
                        />
                        <div className="range-labels">
                            <span>15m</span>
                            <span>120m+</span>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="filter-group">
                        <label className="filter-label">
                            <ChefHat size={16} />
                            Difficulty
                        </label>
                        <div className="filter-buttons">
                            {(['', 'easy', 'medium', 'hard'] as const).map((diff) => (
                                <button
                                    key={diff || 'all'}
                                    className={`filter-btn ${filters.difficulty === diff ? 'active' : ''}`}
                                    onClick={() => handleChange('difficulty', diff)}
                                >
                                    {diff || 'All'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Servings */}
                    <div className="filter-group">
                        <label className="filter-label">
                            <Users size={16} />
                            Servings: {filters.minServings} - {filters.maxServings}
                        </label>
                        <div className="servings-inputs">
                            <input
                                type="number"
                                min="1"
                                max={filters.maxServings}
                                value={filters.minServings}
                                onChange={(e) => handleChange('minServings', parseInt(e.target.value))}
                                className="input servings-input"
                            />
                            <span>to</span>
                            <input
                                type="number"
                                min={filters.minServings}
                                max="20"
                                value={filters.maxServings}
                                onChange={(e) => handleChange('maxServings', parseInt(e.target.value))}
                                className="input servings-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {hasActiveFilters && (
                        <button className="btn btn-ghost" onClick={clearFilters}>
                            Clear All
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={onClose}>
                        Apply Filters
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
