import { useEffect, useState } from 'react';
import './Confetti.css';

interface ConfettiPiece {
    id: number;
    x: number;
    color: string;
    delay: number;
    rotation: number;
}

interface ConfettiProps {
    active: boolean;
    duration?: number;
    pieceCount?: number;
}

const colors = [
    '#6366f1', // primary
    '#f472b6', // accent
    '#22c55e', // success
    '#facc15', // yellow
    '#38bdf8', // cyan
    '#fb923c', // orange
];

export default function Confetti({ active, duration = 3000, pieceCount = 50 }: ConfettiProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (!active) {
            setPieces([]);
            return;
        }

        // Generate confetti pieces
        const newPieces = Array.from({ length: pieceCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 1000,
            rotation: Math.random() * 360,
        }));

        setPieces(newPieces);

        // Clean up after duration
        const timer = setTimeout(() => {
            setPieces([]);
        }, duration);

        return () => clearTimeout(timer);
    }, [active, duration, pieceCount]);

    if (!active || pieces.length === 0) return null;

    return (
        <div className="confetti-container" aria-hidden="true">
            {pieces.map((piece) => (
                <div
                    key={piece.id}
                    className="confetti-piece"
                    style={{
                        left: `${piece.x}%`,
                        backgroundColor: piece.color,
                        animationDelay: `${piece.delay}ms`,
                        transform: `rotate(${piece.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    );
}
