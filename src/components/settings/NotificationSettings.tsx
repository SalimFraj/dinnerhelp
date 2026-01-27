import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Calendar, AlertTriangle, Loader, Check, X } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import './NotificationSettings.css';

export default function NotificationSettings() {
    const {
        isEnabled,
        expirationReminders,
        mealReminders,
        enableNotifications,
        disableNotifications,
        setExpirationReminders,
        setMealReminders,
    } = useNotificationStore();

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleToggleNotifications = async () => {
        if (isEnabled) {
            disableNotifications();
            return;
        }

        setIsLoading(true);
        setStatus('idle');

        try {
            const success = await enableNotifications();
            setStatus(success ? 'success' : 'error');
        } catch {
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status !== 'idle') {
            const timer = setTimeout(() => setStatus('idle'), 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    return (
        <div className="notification-settings">
            <div className="settings-header">
                <div className="settings-icon">
                    {isEnabled ? <Bell size={24} /> : <BellOff size={24} />}
                </div>
                <div>
                    <h3>Push Notifications</h3>
                    <p className="settings-description">
                        Get reminders about expiring ingredients and meal times
                    </p>
                </div>
            </div>

            {/* Main Toggle */}
            <motion.button
                className={`notification-toggle ${isEnabled ? 'enabled' : ''}`}
                onClick={handleToggleNotifications}
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
            >
                {isLoading ? (
                    <>
                        <Loader size={18} className="spinner" />
                        Enabling...
                    </>
                ) : isEnabled ? (
                    <>
                        <Check size={18} />
                        Notifications Enabled
                    </>
                ) : (
                    <>
                        <Bell size={18} />
                        Enable Notifications
                    </>
                )}
            </motion.button>

            {status === 'error' && (
                <div className="notification-error">
                    <X size={16} />
                    Could not enable notifications. Please check browser permissions.
                </div>
            )}

            {/* Sub-options */}
            {isEnabled && (
                <motion.div
                    className="notification-options"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <label className="option-row">
                        <div className="option-info">
                            <AlertTriangle size={18} />
                            <span>Expiration Reminders</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={expirationReminders}
                            onChange={(e) => setExpirationReminders(e.target.checked)}
                        />
                    </label>

                    <label className="option-row">
                        <div className="option-info">
                            <Calendar size={18} />
                            <span>Meal Time Reminders</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={mealReminders}
                            onChange={(e) => setMealReminders(e.target.checked)}
                        />
                    </label>
                </motion.div>
            )}
        </div>
    );
}
