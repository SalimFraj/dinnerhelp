import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, RefreshCw, Check, Zap, ZapOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useUIStore } from '../../stores';
import { detectIngredientCategory, suggestUnit } from '../../services/categorizationService';
import { actionService } from '../../services/actionService';
import './BarcodeScanner.css';

interface Props {
    onClose: () => void;
}

interface ProductInfo {
    name: string;
    brand?: string;
    category?: string;
    image?: string;
}

export default function BarcodeScanner({ onClose }: Props) {
    // Refs
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(false);

    // State
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedProduct, setScannedProduct] = useState<ProductInfo | null>(null);

    // Stores
    const { addToast } = useUIStore();

    // Initialize Scanner
    const startScanner = useCallback(async () => {
        if (!mountedRef.current) return;

        try {
            setIsLoading(true);
            setError(null);

            // Cleanup if exists
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                } catch (e) {
                    console.warn('Error stopping scanner:', e);
                }
            }

            // Create new instance
            const html5QrCode = new Html5Qrcode("barcode-reader");
            scannerRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
            };

            await html5QrCode.start(
                { facingMode: facingMode },
                config,
                (decodedText) => {
                    handleScanSuccess(decodedText);
                },
                (_) => {
                    // Ignore generic parsing errors
                }
            );

            setIsLoading(false);
        } catch (err) {
            console.error("Error starting scanner:", err);
            setError("Could not start camera. Please check permissions.");
            setIsLoading(false);
        }
    }, [facingMode]);

    // Handle successful scan
    const handleScanSuccess = async (decodedText: string) => {
        // Pause scanning logic
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.pause();
        }
        setLookupLoading(true);

        const fetchProduct = async (code: string) => {
            const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${code}.json`
            );
            return await response.json();
        };

        try {
            // Attempt 1: Direct scan
            let data = await fetchProduct(decodedText);
            let product = data.product;

            // Attempt 2: Try adding leading 0 (UPC -> EAN13)
            if (data.status !== 1 && decodedText.length === 12) {
                console.log('Retrying with leading zero...');
                data = await fetchProduct(`0${decodedText}`);
                product = data.product;
            }

            if ((data.status === 1 || data.status === '1') && product) {
                setScannedProduct({
                    name: product.product_name || product.generic_name || 'Unknown Product',
                    brand: product.brands,
                    category: product.categories_tags?.[0]?.replace('en:', ''),
                    image: product.image_front_small_url
                });
            } else {
                const msg = `Product not found (${decodedText}).`;
                setError(msg);
                console.log('Lookup failed:', data);

                setTimeout(() => {
                    handleResume();
                    setError(null);
                    addToast({ type: 'warning', message: msg });
                }, 3000);
            }
        } catch (e) {
            setError('Network error. Check connection.');
            setTimeout(() => {
                handleResume();
                setError(null);
            }, 2000);
        } finally {
            setLookupLoading(false);
        }
    };

    // Initialize on mount
    useEffect(() => {
        mountedRef.current = true;
        // Small delay to ensure DOM is ready
        const timerId = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timerId);
            mountedRef.current = false;
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [startScanner]);

    const handleResume = async () => {
        setScannedProduct(null);
        setError(null);
        // setIsScanning(true); - removed
        if (scannerRef.current) {
            try {
                await scannerRef.current.resume();
            } catch (e) {
                // If resume fails (e.g. was stopped), restart
                startScanner();
            }
        }
    };

    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleToggleTorch = async () => {
        if (!scannerRef.current) return;

        try {
            // Check capabilities first if needed, but for now try apply directly
            // const track = scannerRef.current.getRunningTrackCameraCapabilities();
            // This is a direct video track access if possible, or use library method
            // Html5Qrcode exposes applyVideoConstraints to the running track
            // But getting the actual media stream track is tricky via this wrapper
            // Let's rely on standard constraints update if supported

            // Standard approach: Html5Qrcode doesn't have simple toggleTorch()
            // We have to inspect the video track from the dom element or use applyVideoConstraints

            // Simpler approach for now:
            const html5QrCode = scannerRef.current;
            // @ts-ignore - internal API access or verify support in type defs
            // If the library version supports it. If not, we might need a workaround.
            // Documentation says: applyVideoConstraints(constraints) returns Promise

            await html5QrCode.applyVideoConstraints({
                advanced: [{ torch: !isTorchOn } as any]
            });
            setIsTorchOn(!isTorchOn);
        } catch (err) {
            console.error('Torch toggle failed', err);
            addToast({ type: 'error', message: 'Flashlight not supported' });
        }
    };

    const handleAddProduct = () => {
        if (!scannedProduct) return;

        const category = detectIngredientCategory(scannedProduct.name);
        const unit = suggestUnit(scannedProduct.name, category); // Uses imported service

        actionService.addPantryItem({
            name: scannedProduct.name,
            quantity: 1,
            unit: unit,
            category: category
        });

        addToast({ type: 'success', message: `Added ${scannedProduct.name}` });
        handleResume();
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 100 }}
        >
            <div className="modal barcode-modal">
                <div className="scanner-container">
                    <div id="barcode-reader" />

                    {/* Overlay UI */}
                    <div className="scanner-ui">
                        <div className="scanner-header">
                            <h2>Scan Barcode</h2>
                            <button className="scanner-close-btn" onClick={onClose}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scan Frame */}
                        <div className="scan-frame">
                            {!scannedProduct && (
                                <div className="scan-box">
                                    {(isLoading || lookupLoading) && (
                                        <div className="scan-loading">
                                            <Loader size={32} className="spinner" />
                                            <span>{lookupLoading ? 'Looking up...' : 'Starting camera...'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Controls - Only show when not viewing a product */}
                        {!scannedProduct && (
                            <div className="scanner-controls">
                                <button
                                    className={`camera-switch-btn ${isTorchOn ? 'active' : ''}`}
                                    onClick={handleToggleTorch}
                                    title="Toggle Flashlight"
                                    style={{ marginRight: '1rem', background: isTorchOn ? 'var(--color-primary)' : '' }}
                                >
                                    {isTorchOn ? <Zap size={24} fill="currentColor" /> : <ZapOff size={24} />}
                                </button>
                                <button
                                    className="camera-switch-btn"
                                    onClick={handleSwitchCamera}
                                    title="Switch Camera"
                                >
                                    <RefreshCw size={24} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error Toast Overlay */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="scanner-error-toast"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Product Found Overlay */}
                    <AnimatePresence>
                        {scannedProduct && (
                            <motion.div
                                className="product-result-overlay"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                            >
                                <div className="scanned-product-card">
                                    <div className="scanned-product-header">
                                        <h3 className="scanned-product-title">{scannedProduct.name}</h3>
                                        <p className="scanned-info">
                                            {scannedProduct.brand || 'Unknown Brand'} • {detectIngredientCategory(scannedProduct.name)}
                                        </p>
                                    </div>

                                    <div className="scanned-actions">
                                        <button className="btn btn-secondary" onClick={handleResume}>
                                            Scan Another
                                        </button>
                                        <button className="btn btn-primary" onClick={handleAddProduct}>
                                            <Check size={18} />
                                            Add to Pantry
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
