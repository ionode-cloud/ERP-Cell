import { useEffect, useState } from 'react';

const MESSAGES = [
    { icon: '🎓', text: 'Loading your academic profile...' },
    { icon: '📚', text: 'Fetching your courses...' },
    { icon: '💰', text: 'Calculating fee details...' },
    { icon: '📊', text: 'Getting attendance records...' },
    { icon: '🏆', text: 'Loading your marks...' },
    { icon: '✨', text: 'Almost ready...' },
];

export default function PageLoader({ message }) {
    const [msgIdx, setMsgIdx] = useState(0);
    const [dots, setDots] = useState('');
    const [progress, setProgress] = useState(10);

    useEffect(() => {
        // Cycle through messages
        const msgTimer = setInterval(() => {
            setMsgIdx(i => (i + 1) % MESSAGES.length);
        }, 900);

        // Animate dots
        const dotTimer = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 400);

        // Animate progress bar
        const progTimer = setInterval(() => {
            setProgress(p => p >= 92 ? 92 : p + Math.random() * 8);
        }, 600);

        return () => {
            clearInterval(msgTimer);
            clearInterval(dotTimer);
            clearInterval(progTimer);
        };
    }, []);

    const current = MESSAGES[msgIdx];

    return (
        <div className="page-loader-overlay">
            <div className="page-loader-card">
                {/* Spinning ring */}
                <div className="loader-ring-wrap">
                    <div className="loader-ring" />
                    <div className="loader-ring-icon">{current.icon}</div>
                </div>

                {/* Progress bar */}
                <div className="loader-progress-bar-bg">
                    <div className="loader-progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>

                {/* Message */}
                <p className="loader-message">
                    {message || current.text}<span className="loader-dots">{dots}</span>
                </p>

                {/* Skeleton preview lines */}
                <div className="loader-skeleton">
                    <div className="skeleton-line w80" />
                    <div className="skeleton-line w60" />
                    <div className="skeleton-line w90" />
                    <div className="skeleton-line w50" />
                </div>
            </div>
        </div>
    );
}
