import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            await api.put(`/auth/reset-password/${token}`, { password });
            toast.success('Password reset successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-left animate-fade-in">
                <div className="login-card glass-morphism">
                    <div className="login-header">
                        <div className="login-icon pulse-animation">🔐</div>
                        <h1 className="gradient-text">Reset Password</h1>
                        <p>Enter your new password below</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group interactive-group">
                            <label>New Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="interactive-input"
                                />
                                <button type="button" className="pw-toggle interactive-hover" onClick={() => setShowPw(!showPw)}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group interactive-group">
                            <label>Confirm Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    className="interactive-input"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary btn-block btn-interactive" disabled={loading}>
                            {loading ? <span className="spinner" /> : <Save size={18} />}
                            {loading ? 'Reseting...' : 'Reset Password'}
                        </button>

                        <button 
                            type="button" 
                            className="btn-secondary btn-block" 
                            onClick={() => navigate('/login')}
                            style={{ marginTop: '0.5rem' }}
                        >
                            <ArrowLeft size={18} /> Back to Login
                        </button>
                    </form>
                </div>
            </div>
            <div className="login-right">
                <img 
                    src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                    alt="University Campus" 
                    className="login-image"
                />
                <div className="login-overlay">
                    <div className="overlay-content">
                        <h2>Secure Your <span className="highlight">Account</span></h2>
                        <p>We take security seriously. Please choose a strong password to protect your administrative access.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
