import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
    const [form, setForm] = useState({ loginId: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Trim inputs for robustness
            const trimmedLoginId = form.loginId.trim();
            const trimmedPassword = form.password.trim();
            
            const user = await login(trimmedLoginId, trimmedPassword);
            toast.success(`Access granted. Welcome, ${user.name}`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!form.loginId) {
            return toast.error('Please enter your admin email');
        }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { loginId: form.loginId.trim() });
            toast.success('Security reset link sent to your email');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to initiate reset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-sidebar">
                <div className="sidebar-content">
                    <div className="brand-badge">Institutional Access</div>
                    <h1>Smart Campus <span className="text-accent">ERP</span></h1>
                    <p className="sidebar-quote">"Efficient management is the foundation of institutional excellence."</p>
                    <div className="sidebar-features">
                        <div className="s-feature">
                            <span className="s-f-icon">✦</span>
                            <span>Unified Administrator Controls</span>
                        </div>
                        <div className="s-feature">
                            <span className="s-f-icon">✦</span>
                            <span>Real-time Academic Analytics</span>
                        </div>
                        <div className="s-feature">
                            <span className="s-f-icon">✦</span>
                            <span>Secure Financial Modules</span>
                        </div>
                    </div>
                </div>
                <div className="sidebar-footer">© 2026 Ionode Cloud Solutions</div>
            </div>

            <div className="auth-main">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Sign In</h2>
                        <p>Access your authorized dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-group">
                            <label>University ID / Email</label>
                            <div className="auth-input-wrapper">
                                <User size={18} className="auth-icon" />
                                <input
                                    type="text"
                                    placeholder="Enter your login ID"
                                    value={form.loginId}
                                    onChange={e => setForm({ ...form, loginId: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-group">
                            <label>Security Password</label>
                            <div className="auth-input-wrapper">
                                <Lock size={18} className="auth-icon" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {form.loginId.toLowerCase().trim() === 'ionodecloud@gmail.com' && (
                            <div className="auth-secondary-actions">
                                <button 
                                    type="button"
                                    onClick={handleForgotPassword} 
                                    className="auth-link-btn"
                                    disabled={loading}
                                >
                                    Forgot password ?
                                </button>
                            </div>
                        )}

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <span className="auth-spinner" /> : 'Continue to Dashboard'}
                        </button>
                    </form>

                    <div className="auth-footer-note">
                        <p>Authorized personnel only. Contact administrative support for credentials.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
