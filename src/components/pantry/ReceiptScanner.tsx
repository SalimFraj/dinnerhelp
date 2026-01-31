import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Loader, Check, Upload, Receipt } from 'lucide-react';
import { usePantryStore, useUIStore } from '../../stores';
import { processReceipt, getReceiptResult, type TabScannerResult } from '../../services/tabScannerService';
import './ReceiptScanner.css';

interface Props {
    onClose: () => void;
}

interface ExtractedItem {
    name: string;
    selected: boolean;
    quantity?: number;
    price?: number;
}

export default function ReceiptScanner({ onClose }: Props) {
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
    const [scannedData, setScannedData] = useState<TabScannerResult | null>(null);

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

        // Start Processing
        setIsProcessing(true);
        setStatusText('Uploading receipt...');
        setExtractedItems([]);

        try {
            // 1. Upload and get token
            const token = await processReceipt(file);

            setStatusText('Analyzing receipt...');

            // 2. Poll for results
            let attempts = 0;
            const maxAttempts = 20; // 40 seconds max (2s interval)

            const pollInterval = setInterval(async () => {
                attempts++;
                setStatusText(`Analyzing receipt... (${attempts * 2}s)`);

                try {
                    const result = await getReceiptResult(token);

                    if (result) {
                        clearInterval(pollInterval);
                        handleScanSuccess(result);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        throw new Error('Processing timed out');
                    }
                } catch (err) {
                    clearInterval(pollInterval);
                    handleError(err);
                }
            }, 2000);

        } catch (error) {
            handleError(error);
        }
    }, []);

    const handleScanSuccess = (result: TabScannerResult) => {
        setIsProcessing(false);
        setScannedData(result);

        // Map to extracted items
        const items: ExtractedItem[] = result.lines.map(line => ({
            name: line.description,
            selected: true,
            quantity: line.qty,
            price: line.lineTotal
        })).filter(item => item.name && item.name.length > 2); // Basic filter

        setExtractedItems(items);
        addToast({ type: 'success', message: 'Receipt scanned successfully!' });
    };

    const handleError = (error: any) => {
        console.error('Scan Error:', error);
        setIsProcessing(false);
        addToast({ type: 'error', message: error.message || 'Failed to scan receipt' });
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
                quantity: item.quantity || 1,
                unit: 'unit', // Default unit
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
                    <h2 className="modal-title flex items-center gap-2">
                        <Receipt size={20} className="text-primary-500" />
                        Scan Receipt
                    </h2>
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
                            <div className="text-xs text-center text-muted mt-4">
                                Powered by TabScanner
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
                                <p className="font-medium">{statusText}</p>
                                <p className="text-sm text-white/80">This may take a few seconds...</p>
                            </div>
                        </div>
                    )}

                    {extractedItems.length > 0 && !isProcessing && (
                        <div className="extracted-items">
                            <div className="scan-summary mb-4 p-3 bg-secondary rounded-lg text-sm">
                                {scannedData?.establishment && <div className="font-bold">{scannedData.establishment}</div>}
                                <div className="text-muted flex justify-between">
                                    <span>{scannedData?.date}</span>
                                    <span>Total: ${scannedData?.total?.toFixed(2)}</span>
                                </div>
                            </div>

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
                                        <div className="flex-1">
                                            <span className="item-name block">{item.name}</span>
                                            {item.price && (
                                                <span className="text-xs text-muted">${item.price.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="items-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setImage(null);
                                        setExtractedItems([]);
                                        setScannedData(null);
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
