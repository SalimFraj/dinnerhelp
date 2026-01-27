import { motion } from 'framer-motion';
import './Skeleton.css';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'list-item';
    width?: string | number;
    height?: string | number;
    count?: number;
    className?: string;
}

export default function Skeleton({
    variant = 'rectangular',
    width,
    height,
    count = 1,
    className = '',
}: SkeletonProps) {
    const items = Array.from({ length: count }, (_, i) => i);

    const getDefaultDimensions = () => {
        switch (variant) {
            case 'text':
                return { width: '100%', height: '1rem' };
            case 'circular':
                return { width: '48px', height: '48px' };
            case 'card':
                return { width: '100%', height: '200px' };
            case 'list-item':
                return { width: '100%', height: '72px' };
            default:
                return { width: '100%', height: '100px' };
        }
    };

    const defaults = getDefaultDimensions();

    return (
        <>
            {items.map((i) => (
                <motion.div
                    key={i}
                    className={`skeleton skeleton-${variant} ${className}`}
                    style={{
                        width: width ?? defaults.width,
                        height: height ?? defaults.height,
                    }}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </>
    );
}

// Preset skeleton layouts
export function RecipeCardSkeleton() {
    return (
        <div className="skeleton-recipe-card">
            <Skeleton variant="rectangular" height={180} className="skeleton-image" />
            <div className="skeleton-content">
                <Skeleton variant="text" width="70%" height="1.25rem" />
                <div className="skeleton-meta">
                    <Skeleton variant="text" width={60} height="0.875rem" />
                    <Skeleton variant="text" width={40} height="0.875rem" />
                </div>
            </div>
        </div>
    );
}

export function IngredientSkeleton() {
    return (
        <div className="skeleton-ingredient">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="skeleton-ingredient-content">
                <Skeleton variant="text" width="60%" height="1rem" />
                <Skeleton variant="text" width="30%" height="0.75rem" />
            </div>
        </div>
    );
}

export function ChatMessageSkeleton() {
    return (
        <div className="skeleton-chat-message">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="skeleton-message-content">
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
            </div>
        </div>
    );
}
