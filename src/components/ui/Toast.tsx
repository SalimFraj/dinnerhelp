import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../stores';
import type { Toast as ToastType } from '../../types';
import './Toast.css';

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

export default function Toast({ id, type, message }: ToastType) {
    const { removeToast } = useUIStore();
    const Icon = icons[type];

    return (
        <motion.div
            className={`toast toast-${type}`}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
            <Icon size={20} className="toast-icon" />
            <span className="toast-message">{message}</span>
            <button
                className="toast-close"
                onClick={() => removeToast(id)}
                aria-label="Dismiss"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
