import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { usePantryStore } from '../stores/pantryStore';
import './Analytics.css';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const COLORS = ['#F97316', '#EC4899', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{label || payload[0].name}</p>
                <p className="tooltip-value">
                    ${payload[0].value.toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Analytics() {
    const navigate = useNavigate();
    const { ingredients } = usePantryStore();

    // Calculate Metrics
    const totalValue = ingredients.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalItems = ingredients.length;

    // Prepare Data: Spending by Category
    const categoryDataMap = ingredients.reduce((acc, item) => {
        const cat = item.category || 'other';
        acc[cat] = (acc[cat] || 0) + (item.price || 0);
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryDataMap)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value);

    // Prepare Data: Top Expensive Items
    const topItemsData = [...ingredients]
        .sort((a, b) => (b.price || 0) - (a.price || 0))
        .slice(0, 5)
        .map(item => ({
            name: item.name,
            value: item.price || 0
        }))
        .filter(d => d.value > 0);

    return (
        <div className="page analytics-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="analytics-content"
            >
                {/* Header */}
                <header className="header analytics-header">
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="analytics-title">Spending & Insights</h1>
                        <p className="analytics-subtitle">Track your pantry value</p>
                    </div>
                </header>

                {/* Summary Cards */}
                <section className="analytics-summary">
                    <div className="summary-card">
                        <div className="summary-icon">
                            <DollarSign size={20} />
                        </div>
                        <span className="summary-value">${totalValue.toFixed(2)}</span>
                        <span className="summary-label">Total Value</span>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="summary-value">{totalItems}</span>
                        <span className="summary-label">Total Items</span>
                    </div>
                </section>

                {/* Charts */}
                {totalValue > 0 ? (
                    <>
                        <section className="chart-section">
                            <div className="chart-header">
                                <h2 className="chart-title">Spending by Category</h2>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {categoryData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="chart-section">
                            <div className="chart-header">
                                <h2 className="chart-title">Top Expensive Items</h2>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={topItemsData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </>
                ) : (
                    <div className="empty-state">
                        <TrendingUp size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>No priced items found.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Scan receipts to see analytics.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
