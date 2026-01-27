import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect iOS
const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Detect if in standalone mode (already installed)
const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
};

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Don't show if already installed
        if (isStandalone()) {
            return;
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            // Show again after 3 days (reduced from 7)
            if (daysSince < 3) {
                return;
            }
        }

        // For iOS - show after brief delay
        if (isIOS()) {
            setTimeout(() => setShowPrompt(true), 2000);
            return;
        }

        // For Android/Desktop - listen for install event
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show immediately when event fires
            setTimeout(() => setShowPrompt(true), 1000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Also show prompt after 5 seconds if event hasn't fired
        // This covers browsers that might not fire the event
        const fallbackTimer = setTimeout(() => {
            if (!deferredPrompt) {
                setShowPrompt(true);
            }
        }, 5000);

        // Detect when installed
        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            setShowIOSGuide(false);
            setDeferredPrompt(null);
            localStorage.setItem('pwa-installed', 'true');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            clearTimeout(fallbackTimer);
        };
    }, [deferredPrompt]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Chrome/Android install flow
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                localStorage.setItem('pwa-installed', 'true');
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        } else if (isIOS()) {
            // Show iOS guide
            setShowIOSGuide(true);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSGuide(false);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    if (isStandalone() || !showPrompt) return null;

    return (
        <AnimatePresence>
            {showIOSGuide ? (
                <motion.div
                    className="install-prompt ios-guide"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                >
                    <button className="install-dismiss" onClick={handleDismiss}>
                        <X size={18} />
                    </button>

                    <div className="ios-guide-content">
                        <h4>📱 Install DinnerHelp</h4>
                        <ol className="ios-steps">
                            <li>
                                <Share size={16} />
                                <span>Tap the <strong>Share</strong> button below</span>
                            </li>
                            <li>
                                <PlusSquare size={16} />
                                <span>Scroll and tap <strong>"Add to Home Screen"</strong></span>
                            </li>
                            <li>
                                <Smartphone size={16} />
                                <span>Tap <strong>Add</strong> to install</span>
                            </li>
                        </ol>
                    </div>

                    <button className="install-got-it" onClick={handleDismiss}>
                        Got it!
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    className="install-prompt"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                >
                    <button className="install-dismiss" onClick={handleDismiss}>
                        <X size={18} />
                    </button>

                    <div className="install-icon">
                        <Smartphone size={28} />
                    </div>

                    <div className="install-content">
                        <h4>Install DinnerHelp</h4>
                        <p>{isIOS() ? 'Add to your home screen' : 'Get quick access from your home screen'}</p>
                    </div>

                    <button className="install-button" onClick={handleInstall}>
                        <Download size={18} />
                        Install
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
