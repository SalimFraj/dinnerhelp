import { useState, useRef, useEffect, useCallback } from 'react';

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    disabled?: boolean;
}

export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    disabled = false,
}: UsePullToRefreshOptions) {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (disabled || isRefreshing) return;
        const container = containerRef.current;
        if (!container || container.scrollTop > 0) return;

        startY.current = e.touches[0].clientY;
        setIsPulling(true);
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling || disabled || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // Resistance effect - slower pull as you go further
            const distance = Math.min(diff * 0.5, threshold * 1.5);
            setPullDistance(distance);

            // Prevent default scroll when pulling down
            if (containerRef.current?.scrollTop === 0) {
                e.preventDefault();
            }
        }
    }, [isPulling, disabled, isRefreshing, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling || disabled) return;

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
            }
        }

        setIsPulling(false);
        setPullDistance(0);
    }, [isPulling, pullDistance, threshold, onRefresh, disabled]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return {
        containerRef,
        isPulling,
        pullDistance,
        isRefreshing,
        progress: Math.min(pullDistance / threshold, 1),
    };
}
