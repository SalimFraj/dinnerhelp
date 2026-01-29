import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { usePantryStore, useUIStore } from '../../stores';
import { detectIngredientCategory, suggestUnit } from '../../services/categorizationService';
import './BarcodeScanner.css';

interface Props {
    onClose: () => void;
}

interface ProductInfo {
    name: string;
    brand?: string;
    category?: string;
}

export default function BarcodeScanner({ onClose }: Props) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedProduct, setScannedProduct] = useState<ProductInfo | null>(null);
    const { addIngredient } = usePantryStore();
    const { addToast } = useUIStore();
    // const [scannerMounted, setScannerMounted] = useState(false);

    const onScanSuccess = useCallback(async (decodedText: string) => {
        // Stop scanning temporarily
        if (scannerRef.current) {
            try {
                await scannerRef.current.clear();
                scannerRef.current = null;
                // setScannerMounted(false);
            } catch (e) {
                console.error("Failed to clear scanner", e);
            }
        }

        setIsLoading(true);
        setError(null);

        try {
            // Look up product in Open Food Facts
            const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`
            );
            const data = await response.json();

            if (data.status === 1 && data.product) {
                const product = data.product;
                setScannedProduct({
                    name: product.product_name || product.generic_name || 'Unknown Product',
                    brand: product.brands,
                    category: product.categories_tags?.[0]?.replace('en:', '') || undefined,
                });
            } else {
                setError(`Product not found (${decodedText}). You can add it manually.`);
            }
        } catch (err) {
            setError('Failed to look up product. Check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const onScanError = useCallback((_errorMessage: string) => {
        // Ignore generic ignore errors
        // console.warn(errorMessage);
    }, []);

    const startScanner = useCallback(() => {
        // Wait for DOM
        setTimeout(() => {
            if (scannerRef.current) return; // Already running

            try {
                const scanner = new Html5QrcodeScanner(
                    'barcode-reader',
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                        rememberLastUsedCamera: true,
                        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true,
                    },
                    false
                );

                scannerRef.current = scanner;
                scanner.render(onScanSuccess, onScanError);
                // setScannerMounted(true);
            } catch (e) {
                console.error("Failed to start scanner", e);
                setError("Camera failed to start. Please check permissions.");
            }
        }, 100);
    }, [onScanSuccess, onScanError]);

    // Initial start
    useEffect(() => {
        if (!scannedProduct && !isLoading && !error) {
            startScanner();
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, []); // Run once on mount

    const handleAddProduct = () => {
        if (!scannedProduct) return;

        const category = detectIngredientCategory(scannedProduct.name);
        const unit = suggestUnit(scannedProduct.name, category);

        addIngredient({
            name: scannedProduct.name,
            quantity: 1,
            unit: unit,
            category: category,
        });

        addToast({ type: 'success', message: `Added ${scannedProduct.name}` });
        onClose();
    };

    const handleScanAgain = () => {
        setScannedProduct(null);
        setError(null);
        setIsLoading(false);
        startScanner();
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
                className="modal barcode-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">Scan Barcode</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {!scannedProduct && !error && !isLoading && (
                        <>
                            <p className="scanner-instruction">
                                Point your camera at a product barcode
                            </p>
                            <div id="barcode-reader" className="barcode-reader" />
                        </>
                    )}

                    {isLoading && (
                        <div className="scanner-loading">
                            <Loader size={32} className="spinner" />
                            <p>Looking up product...</p>
                        </div>
                    )}

                    {error && (
                        <div className="scanner-error">
                            <AlertCircle size={48} />
                            <p>{error}</p>
                            <button className="btn btn-secondary" onClick={handleScanAgain}>
                                <RefreshCw size={18} />
                                Try Again
                            </button>
                        </div>
                    )}

                    {scannedProduct && (
                        <div className="scanned-product">
                            <div className="product-info">
                                <h3>{scannedProduct.name}</h3>
                                {scannedProduct.brand && (
                                    <p className="product-brand">{scannedProduct.brand}</p>
                                )}
                            </div>
                            <div className="product-actions">
                                <button className="btn btn-secondary" onClick={handleScanAgain}>
                                    Scan Another
                                </button>
                                <button className="btn btn-primary" onClick={handleAddProduct}>
                                    Add to Pantry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
