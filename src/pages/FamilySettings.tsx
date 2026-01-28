import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Copy,
    Check,
    RefreshCw,
    LogOut,
    ArrowLeft,
    Plus,
    UserPlus,
    Home,
    Loader,
    AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores';
import {
    createHousehold,
    joinHousehold,
    leaveHousehold,
    getHousehold,
    getUserHouseholdId,
    regenerateInviteCode,
    type Household
} from '../services/householdService';
import './FamilySettings.css';

export default function FamilySettings() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { addToast } = useUIStore();

    const [household, setHousehold] = useState<Household | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [householdName, setHouseholdName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [error, setError] = useState('');

    // Load household on mount
    useEffect(() => {
        async function loadHousehold() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const householdId = await getUserHouseholdId(user.uid);
                if (householdId) {
                    const h = await getHousehold(householdId);
                    setHousehold(h);
                }
            } catch (err) {
                console.error('Error loading household:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadHousehold();
    }, [user]);

    const handleCreateHousehold = async () => {
        if (!user || !householdName.trim()) return;

        setIsCreating(true);
        setError('');

        try {
            const h = await createHousehold(user.uid, householdName.trim());
            setHousehold(h);
            addToast({ type: 'success', message: 'Household created!' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create household';
            setError(message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinHousehold = async () => {
        if (!user || !inviteCode.trim()) return;

        setIsJoining(true);
        setError('');

        try {
            const h = await joinHousehold(user.uid, inviteCode.trim());
            setHousehold(h);
            addToast({ type: 'success', message: 'Joined household!' });
            setShowJoinForm(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to join household';
            setError(message);
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveHousehold = async () => {
        if (!user || !household) return;

        const isOwner = household.ownerId === user.uid;
        const confirmMessage = isOwner
            ? 'Are you sure you want to leave? As the owner, the household will remain for other members.'
            : 'Are you sure you want to leave this household?';

        if (!confirm(confirmMessage)) return;

        try {
            await leaveHousehold(user.uid, household.id);
            setHousehold(null);
            addToast({ type: 'success', message: 'Left household' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to leave household';
            addToast({ type: 'error', message });
        }
    };

    const handleCopyCode = async () => {
        if (!household) return;

        try {
            await navigator.clipboard.writeText(household.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            addToast({ type: 'error', message: 'Failed to copy' });
        }
    };

    const handleRegenerateCode = async () => {
        if (!user || !household) return;

        try {
            const newCode = await regenerateInviteCode(user.uid, household.id);
            setHousehold({ ...household, inviteCode: newCode });
            addToast({ type: 'success', message: 'New invite code generated' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to regenerate code';
            addToast({ type: 'error', message });
        }
    };

    if (!user) {
        return (
            <div className="page family-page">
                <header className="page-header">
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="page-title">Family Sharing</h1>
                </header>
                <div className="family-empty">
                    <Users size={64} />
                    <h2>Sign in Required</h2>
                    <p>Please sign in to use family sharing</p>
                    <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="page family-page">
                <div className="family-loading">
                    <Loader size={32} className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="page family-page">
            <header className="page-header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="page-title">Family Sharing</h1>
            </header>

            {error && (
                <motion.div
                    className="family-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </motion.div>
            )}

            {/* No Household - Show Create/Join Options */}
            {!household && !showJoinForm && (
                <motion.div
                    className="family-setup"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="family-setup-icon">
                        <Users size={48} />
                    </div>
                    <h2>Share with Family</h2>
                    <p>Create a household to share your pantry, shopping lists, and meal plans with family members.</p>

                    <div className="family-setup-form">
                        <input
                            type="text"
                            placeholder="Household name (e.g., Smith Family)"
                            value={householdName}
                            onChange={(e) => setHouseholdName(e.target.value)}
                            className="family-input"
                        />
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCreateHousehold}
                            disabled={isCreating || !householdName.trim()}
                        >
                            {isCreating ? (
                                <Loader size={18} className="spinner" />
                            ) : (
                                <Plus size={18} />
                            )}
                            Create Household
                        </button>
                    </div>

                    <div className="family-divider">
                        <span>or</span>
                    </div>

                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={() => setShowJoinForm(true)}
                    >
                        <UserPlus size={18} />
                        Join Existing Household
                    </button>
                </motion.div>
            )}

            {/* Join Form */}
            {!household && showJoinForm && (
                <motion.div
                    className="family-join"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="family-setup-icon">
                        <UserPlus size={48} />
                    </div>
                    <h2>Join Household</h2>
                    <p>Enter the invite code shared by a family member.</p>

                    <div className="family-setup-form">
                        <input
                            type="text"
                            placeholder="Enter 6-character code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="family-input family-code-input"
                            maxLength={6}
                        />
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleJoinHousehold}
                            disabled={isJoining || inviteCode.length !== 6}
                        >
                            {isJoining ? (
                                <Loader size={18} className="spinner" />
                            ) : (
                                <Check size={18} />
                            )}
                            Join Household
                        </button>
                    </div>

                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            setShowJoinForm(false);
                            setInviteCode('');
                            setError('');
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                </motion.div>
            )}

            {/* Has Household - Show Info */}
            {household && (
                <motion.div
                    className="family-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Household Card */}
                    <div className="household-card">
                        <div className="household-icon">
                            <Home size={32} />
                        </div>
                        <h2>{household.name}</h2>
                        <p>{household.memberIds.length} member{household.memberIds.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Invite Code Section */}
                    <div className="invite-section">
                        <h3>Invite Code</h3>
                        <p>Share this code with family members to let them join</p>

                        <div className="invite-code-display">
                            <span className="invite-code">{household.inviteCode}</span>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={handleCopyCode}
                                title="Copy code"
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                            {household.ownerId === user.uid && (
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={handleRegenerateCode}
                                    title="Generate new code"
                                >
                                    <RefreshCw size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Leave Button */}
                    <button
                        className="btn btn-ghost leave-btn"
                        onClick={handleLeaveHousehold}
                    >
                        <LogOut size={18} />
                        Leave Household
                    </button>
                </motion.div>
            )}
        </div>
    );
}
