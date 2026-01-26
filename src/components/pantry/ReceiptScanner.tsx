import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Loader, Check, Upload } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { usePantryStore, useUIStore } from '../../stores';
import './ReceiptScanner.css';

interface Props {
    onClose: () => void;
}

interface ExtractedItem {
    name: string;
    selected: boolean;
}

export default function ReceiptScanner({ onClose }: Props) {
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addIngredient } = usePantryStore();
    const { addToast } = useUIStore();

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Process with Tesseract
        setIsProcessing(true);
        setProgress(0);

        try {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            // Parse the extracted text into potential grocery items
            const items = parseReceiptText(result.data.text);
            setExtractedItems(items.map(name => ({ name, selected: true })));
        } catch (error) {
            console.error('OCR Error:', error);
            addToast({ type: 'error', message: 'Failed to read receipt. Try a clearer image.' });
        } finally {
            setIsProcessing(false);
        }
    }, [addToast]);

    // Simple receipt parser - extracts likely grocery items
    const parseReceiptText = (text: string): string[] => {
        const lines = text.split('\n');
        const items: string[] = [];

        // Common patterns to exclude (prices, totals, store info)
        const excludePatterns = [
            /^\$?\d+\.?\d*$/,           // Just numbers/prices
            /total/i,                   // Totals
            /subtotal/i,
            /tax/i,
            /change/i,
            /card/i,
            /visa|mastercard|amex/i,
            /thank you/i,
            /welcome/i,
            /^\d{1,2}\/\d{1,2}/,        // Dates
            /^\d{1,2}:\d{2}/,           // Times
            /^x\d+/i,                   // Quantity markers
            /^\s*$/,                    // Empty lines
        ];

        lines.forEach(line => {
            // Clean the line
            let cleaned = line.trim()
                .replace(/\$[\d.]+/g, '')      // Remove prices
                .replace(/\d+\.\d{2}/g, '')    // Remove decimal numbers
                .replace(/[^\w\s'-]/g, '')     // Remove special chars
                .trim();

            // Skip if too short or matches exclude patterns
            if (cleaned.length < 3) return;
            if (excludePatterns.some(p => p.test(cleaned))) return;

            // Skip if it's mostly numbers
            if (cleaned.replace(/\d/g, '').length < cleaned.length / 2) return;

            if (cleaned) {
                items.push(cleaned.toLowerCase());
            }
        });

        // Remove duplicates and return
        return [...new Set(items)].slice(0, 20);
    };

    const toggleItem = (index: number) => {
        setExtractedItems(items =>
            items.map((item, i) =>
                i === index ? { ...item, selected: !item.selected } : item
            )
        );
    };

    const handleAddItems = () => {
        const selectedItems = extractedItems.filter(item => item.selected);

        selectedItems.forEach(item => {
            addIngredient({
                name: item.name,
                quantity: 1,
                unit: 'unit',
                category: 'other',
            });
        });

        addToast({
            type: 'success',
            message: `Added ${selectedItems.length} items to pantry`
        });
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
                className="modal receipt-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">Scan Receipt</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {!image && !isProcessing && extractedItems.length === 0 && (
                        <div className="receipt-upload">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            <div
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="upload-icon">
                                    <Camera size={32} />
                                </div>
                                <h3>Take Photo or Upload</h3>
                                <p>Snap a photo of your grocery receipt</p>
                                <button className="btn btn-primary">
                                    <Upload size={18} />
                                    Choose Image
                                </button>
                            </div>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="receipt-processing">
                            {image && (
                                <img src={image} alt="Receipt" className="receipt-preview" />
                            )}
                            <div className="processing-overlay">
                                <Loader size={32} className="spinner" />
                                <p>Reading receipt... {progress}%</p>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {extractedItems.length > 0 && (
                        <div className="extracted-items">
                            <p className="items-instruction">
                                Select items to add to your pantry:
                            </p>
                            <div className="items-list">
                                {extractedItems.map((item, index) => (
                                    <label key={index} className="item-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => toggleItem(index)}
                                        />
                                        <span className="checkmark">
                                            {item.selected && <Check size={14} />}
                                        </span>
                                        <span className="item-name">{item.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="items-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setImage(null);
                                        setExtractedItems([]);
                                    }}
                                >
                                    Scan Another
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAddItems}
                                    disabled={!extractedItems.some(i => i.selected)}
                                >
                                    Add Selected ({extractedItems.filter(i => i.selected).length})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
