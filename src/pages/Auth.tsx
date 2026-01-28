import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    Loader,
    ChefHat,
    AlertCircle,
    Phone,
    ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores';
import './Auth.css';

type AuthMode = 'login' | 'register' | 'phone' | 'otp';

export default function Auth() {
    const navigate = useNavigate();
    const {
        login,
        register,
        loginWithGoogle,
        sendPhoneCode,
        verifyPhoneCode,
        isLoading,
        phoneVerificationPending,
        user
    } = useAuthStore();
    const { addToast } = useUIStore();

    const [mode, setMode] = useState<AuthMode>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        otp: '',
    });
    const [error, setError] = useState('');

    // If already logged in, show account options
    if (user) {
        return (
            <div className="auth-page">
                <motion.div
                    className="auth-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="auth-header">
                        <div className="auth-logo">
                            <ChefHat size={32} />
                        </div>
                        <h1>Welcome back!</h1>
                        <p>{user.displayName || user.email || user.phoneNumber}</p>
                    </div>

                    <div className="auth-account-info">
                        {user.photoURL && (
                            <img src={user.photoURL} alt="Avatar" className="account-avatar" />
                        )}
                        <p className="account-email">{user.email || user.phoneNumber}</p>
                    </div>

                    <button
                        className="btn btn-primary btn-lg auth-submit"
                        onClick={() => navigate('/')}
                    >
                        Continue to App
                    </button>

                    <button
                        className="auth-skip"
                        onClick={async () => {
                            await useAuthStore.getState().logout();
                            addToast({ type: 'success', message: 'Signed out' });
                        }}
                    >
                        Sign Out
                    </button>
                </motion.div>
            </div>
        );
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (mode === 'login') {
                await login(formData.email, formData.password);
            } else {
                await register(formData.email, formData.password, formData.name);
            }
            addToast({ type: 'success', message: `Welcome${formData.name ? `, ${formData.name}` : ''}!` });
            navigate('/');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setError(message);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (phoneVerificationPending) {
                // Verify OTP
                await verifyPhoneCode(formData.otp);
                addToast({ type: 'success', message: 'Welcome!' });
                navigate('/');
            } else {
                // Send OTP
                const phoneNumber = formData.phone.startsWith('+')
                    ? formData.phone
                    : `+1${formData.phone.replace(/\D/g, '')}`;
                await sendPhoneCode(phoneNumber, 'phone-sign-in-button');
                setMode('otp');
                addToast({ type: 'success', message: 'Code sent!' });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Phone authentication failed';
            setError(message);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await loginWithGoogle();
            addToast({ type: 'success', message: 'Welcome!' });
            navigate('/');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Google sign-in failed';
            setError(message);
        }
    };

    const isEmailMode = mode === 'login' || mode === 'register';
    const isPhoneMode = mode === 'phone' || mode === 'otp';

    return (
        <div className="auth-page">
            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="auth-header">
                    {isPhoneMode && (
                        <button
                            className="auth-back-btn"
                            onClick={() => setMode('login')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="auth-logo">
                        <ChefHat size={32} />
                    </div>
                    <h1>DinnerHelp</h1>
                    <p>
                        {mode === 'login' && 'Welcome back!'}
                        {mode === 'register' && 'Create your account'}
                        {mode === 'phone' && 'Sign in with phone'}
                        {mode === 'otp' && 'Enter verification code'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        className="auth-error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </motion.div>
                )}

                {/* Email/Password Form */}
                {isEmailMode && (
                    <form onSubmit={handleEmailSubmit} className="auth-form">
                        {mode === 'register' && (
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg auth-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader size={18} className="spinner" />
                                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                                </>
                            ) : (
                                mode === 'login' ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>
                )}

                {/* Phone Form */}
                {isPhoneMode && (
                    <form onSubmit={handlePhoneSubmit} className="auth-form">
                        {mode === 'phone' && (
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <div className="input-wrapper">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <p className="input-hint">Include country code (e.g., +1 for US)</p>
                            </div>
                        )}

                        {mode === 'otp' && (
                            <div className="form-group">
                                <label htmlFor="otp">Verification Code</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={formData.otp}
                                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        required
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                <p className="input-hint">Enter the 6-digit code sent to {formData.phone}</p>
                            </div>
                        )}

                        <button
                            id="phone-sign-in-button"
                            type="submit"
                            className="btn btn-primary btn-lg auth-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader size={18} className="spinner" />
                                    {mode === 'phone' ? 'Sending code...' : 'Verifying...'}
                                </>
                            ) : (
                                mode === 'phone' ? 'Send Code' : 'Verify'
                            )}
                        </button>
                    </form>
                )}

                {/* Divider */}
                {isEmailMode && (
                    <>
                        <div className="auth-divider">
                            <span>or continue with</span>
                        </div>

                        {/* Social Login */}
                        <div className="auth-social-buttons">
                            <button
                                className="btn btn-secondary btn-lg google-btn"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </button>

                            <button
                                className="btn btn-secondary btn-lg phone-btn"
                                onClick={() => setMode('phone')}
                                disabled={isLoading}
                            >
                                <Phone size={20} />
                                Phone
                            </button>
                        </div>

                        {/* Toggle */}
                        <p className="auth-toggle">
                            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                type="button"
                                onClick={() => {
                                    setMode(mode === 'login' ? 'register' : 'login');
                                    setError('');
                                }}
                            >
                                {mode === 'login' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </>
                )}

                {/* Skip */}
                <button
                    className="auth-skip"
                    onClick={() => navigate('/')}
                >
                    Continue without account
                </button>
            </motion.div>
        </div>
    );
}
