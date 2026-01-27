import { useState, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Trash2, Edit2 } from 'lucide-react';
import './SwipeableRow.css';

interface SwipeableRowProps {
    children: ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    disabled?: boolean;
}

export default function SwipeableRow({
    children,
    onDelete,
    onEdit,
    disabled = false,
}: SwipeableRowProps) {
    const [isOpen, setIsOpen] = useState(false);
    const constraintsRef = useRef(null);
    const x = useMotionValue(0);

    // Transform x position to opacity/scale for action buttons
    const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
    const editOpacity = useTransform(x, [60, 100], [0, 1]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 60;
        const velocity = info.velocity.x;

        if (info.offset.x < -threshold || velocity < -500) {
            // Swiped left - show delete
            setIsOpen(true);
        } else if (info.offset.x > threshold || velocity > 500) {
            // Swiped right - trigger edit (if available)
            if (onEdit) {
                onEdit();
            }
            setIsOpen(false);
        } else {
            setIsOpen(false);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
        }
        setIsOpen(false);
    };

    if (disabled) {
        return <div className="swipeable-row-content">{children}</div>;
    }

    return (
        <div className="swipeable-row" ref={constraintsRef}>
            {/* Background actions */}
            <div className="swipeable-actions">
                {onEdit && (
                    <motion.button
                        className="swipeable-action edit"
                        style={{ opacity: editOpacity }}
                        onClick={onEdit}
                    >
                        <Edit2 size={20} />
                        <span>Edit</span>
                    </motion.button>
                )}
                <motion.button
                    className="swipeable-action delete"
                    style={{ opacity: deleteOpacity }}
                    onClick={handleDelete}
                >
                    <Trash2 size={20} />
                    <span>Delete</span>
                </motion.button>
            </div>

            {/* Swipeable content */}
            <motion.div
                className="swipeable-content"
                drag="x"
                dragConstraints={{ left: -100, right: onEdit ? 100 : 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                animate={{ x: isOpen ? -100 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
