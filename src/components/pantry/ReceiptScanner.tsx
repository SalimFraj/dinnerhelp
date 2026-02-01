import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Loader, Check, Upload, Receipt } from 'lucide-react';
import { useUIStore } from '../../stores';
import { usePantryStore } from '../../stores/pantryStore';
import { processReceipt, getReceiptResult, type TabScannerResult } from '../../services/tabScannerService';
import { cleanReceiptText } from '../../services/chatService';
import './ReceiptScanner.css';

interface Props {
    onClose: () => void;
}

interface ExtractedItem {
    name: string;
    originalName: string;
    selected: boolean;
    quantity?: number;
    price?: number;
}

export default function ReceiptScanner({ onClose }: Props) {
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
    const [scannedData, setScannedData] = useState<TabScannerResult | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useUIStore();
    const { addIngredientSmart } = usePantryStore();

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
                        await handleScanSuccess(result);
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

    const handleScanSuccess = async (result: TabScannerResult) => {
        setIsProcessing(false);
        setIsCleaning(true); // Start AI cleaning phase
        setScannedData(result);

        // Map initial raw items
        const rawItems = result.lines
            .filter(line => line.description.length > 2)
            .map(line => ({
                name: line.description,
                quantity: line.qty,
                price: line.lineTotal
            }));

        try {
            // 3. AI Cleaning Step
            const cleaned = await cleanReceiptText(rawItems);

            setExtractedItems(cleaned.map(item => ({
                ...item,
                selected: true
            })));

            addToast({ type: 'success', message: 'Receipt scanned & cleaned!' });
        } catch (error) {
            console.error('Cleaning failed', error);
            // Fallback to raw items
            setExtractedItems(rawItems.map(item => ({
                ...item,
                originalName: item.name,
                selected: true
            })));
        } finally {
            setIsCleaning(false);
        }
    };

    const handleError = (error: any) => {
        console.error('Scan Error:', error);
        setIsProcessing(false);
        setIsCleaning(false);
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
            addIngredientSmart(
                item.name,
                item.quantity || 1,
                undefined, // auto-detect unit
                undefined, // no expiration yet
                item.price // Pass price data
            );
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

                    {(isProcessing || isCleaning) && (
                        <div className="receipt-processing">
                            {image && (
                                <img src={image} alt="Receipt" className="receipt-preview" />
                            )}
                            <div className="processing-overlay">
                                <Loader size={32} className="spinner" />
                                <p className="font-medium">
                                    {isCleaning ? 'AI Cleaning items...' : statusText}
                                </p>
                                <p className="text-sm text-white/80">
                                    {isCleaning ? 'Making it look nice ✨' : 'This may take a few seconds...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {extractedItems.length > 0 && !isProcessing && !isCleaning && (
                        <div className="extracted-items">
                            <div className="scan-summary mb-4 p-3 bg-secondary rounded-lg text-sm">
                                {scannedData?.establishment && <div className="font-bold text-lg mb-1">{scannedData.establishment}</div>}
                                <div className="text-muted flex justify-between">
                                    <span>{scannedData?.date}</span>
                                    <span className="font-medium text-primary-500">Total: ${scannedData?.total?.toFixed(2)}</span>
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
                                        <div className="flex-1 min-w-0">
                                            <span className="item-name block truncate font-medium">
                                                {item.name}
                                            </span>
                                            {item.name !== item.originalName && (
                                                <span className="text-xs text-muted block truncate">
                                                    Original: {item.originalName}
                                                </span>
                                            )}
                                        </div>
                                        {item.price && (
                                            <span className="text-sm font-medium text-primary-500 whitespace-nowrap">
                                                ${item.price.toFixed(2)}
                                            </span>
                                        )}
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
