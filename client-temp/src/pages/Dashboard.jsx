import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, GraduationCap, BookOpen, IndianRupee, TrendingUp } from 'lucide-react';

const CHART_COLORS = ['#4f46e5', '#0891b2', '#059669', '#dc2626', '#d97706', '#7c3aed', '#db2777'];

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: color }}>
                <Icon size={24} color="#fff" />
            </div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                {sub && <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );
}

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    if (percent < 0.06) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [revenue, setRevenue] = useState([]);
    const [branchStudents, setBranchStudents] = useState([]);
    const [branchFees, setBranchFees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user?.role === 'admin') {
                    const [sRes, tRes, bRes, rRes] = await Promise.all([
                        api.get('/students/stats'),
                        api.get('/teachers'),
                        api.get('/branches'),
                        api.get('/fees/summary'),
                    ]);

                    const branchList = bRes.data.data || [];
                    setBranches(branchList);

                    // Total students from stats endpoint
                    const totalStudents = sRes.data.data?.totalStudents ?? sRes.data.total ?? 0;

                    setStats({
                        students: totalStudents,
                        teachers: tRes.data.data?.length ?? 0,
                        branches: branchList.length,
                        revenue: rRes.data.totalRevenue || 0,
                        totalFees: rRes.data.totalFees || 0,
                        pending: rRes.data.totalPending || 0,
                    });

                    setRevenue(rRes.data.monthly || []);
                    setBranchFees(rRes.data.byBranch || []);

                    // Students per branch from the stats
                    const byBranch = sRes.data.data?.byBranch || [];
                    setBranchStudents(byBranch.map(b => ({ name: b.name, students: b.count })));
                }
            } catch {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
    if (user?.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user?.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.name}! Here's what's happening today.</p>
                </div>
            </div>

            {user?.role === 'admin' && stats && (
                <>
                    {/* Stat Cards */}
                    <div className="stats-grid">
                        <StatCard icon={GraduationCap} label="Total Students" value={stats.students ?? '—'} color="#4f46e5" sub={`across ${stats.branches} branches`} />
                        <StatCard icon={Users} label="Total Teachers" value={stats.teachers ?? '—'} color="#0891b2" />
                        <StatCard icon={BookOpen} label="Branches" value={stats.branches ?? '—'} color="#059669" />
                        <StatCard icon={IndianRupee} label="Revenue Collected" value={`₹${(stats.revenue || 0).toLocaleString()}`} color="#dc2626" sub={`₹${(stats.pending || 0).toLocaleString()} pending`} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        {/* Monthly Revenue Chart */}
                        <div className="card">
                            <div className="card-header-row" style={{ marginBottom: '1rem' }}>
                                <h2 className="card-title"><TrendingUp size={18} />Monthly Revenue</h2>
                                <span className="text-muted-sm">₹{(stats.revenue || 0).toLocaleString()} total</span>
                            </div>
                            {revenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={revenue}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="amount" stroke="#4f46e5" fill="url(#colorRev)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state-sm">No payment records yet</div>
                            )}
                        </div>

                        {/* Students per Branch Pie */}
                        <div className="card">
                            <div className="card-header-row" style={{ marginBottom: '1rem' }}>
                                <h2 className="card-title"><GraduationCap size={18} />Students by Branch</h2>
                                <span className="text-muted-sm">{stats.students} total</span>
                            </div>
                            {branchStudents.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={branchStudents}
                                            dataKey="students"
                                            nameKey="name"
                                            cx="50%" cy="50%"
                                            outerRadius={85}
                                            labelLine={false}
                                            label={PieLabel}
                                        >
                                            {branchStudents.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [v, n]} />
                                        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state-sm">No student data</div>
                            )}
                        </div>
                    </div>

                    {/* Branch-wise Fee Bar Chart */}
                    {branchFees.length > 0 && (
                        <div className="card" style={{ marginBottom: '1.25rem' }}>
                            <div className="card-header-row" style={{ marginBottom: '1rem' }}>
                                <h2 className="card-title"><IndianRupee size={18} />Fee Collection by Branch</h2>
                                <span className="text-muted-sm">Collected vs Pending</span>
                            </div>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={branchFees} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={v => [`₹${v.toLocaleString()}`, '']} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="collected" name="Collected" fill="#059669" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pending" name="Pending" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Branch Summary Table */}
                    {branches.length > 0 && (
                        <div className="card">
                            <div className="card-header-row" style={{ marginBottom: '.75rem' }}>
                                <h2 className="card-title"><BookOpen size={18} />Branch Overview</h2>
                            </div>
                            <div className="table-wrapper">
                                <table className="mini-table">
                                    <thead>
                                        <tr>
                                            <th>Branch</th>
                                            <th>Code</th>
                                            <th>Students</th>
                                            <th>Teachers</th>
                                            <th>Total Fees (₹)</th>
                                            <th>Collected (₹)</th>
                                            <th>Pending (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branches.map((b, i) => {
                                            const feeData = branchFees.find(f => f.name === b.name) || {};
                                            return (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                                                    <td><span className="badge badge-sm" style={{ background: '#dbeafe', color: '#1e40af' }}>{b.code}</span></td>
                                                    <td>{b.studentCount ?? 0}</td>
                                                    <td>{b.teacherCount ?? 0}</td>
                                                    <td>{(feeData.totalFees || 0).toLocaleString()}</td>
                                                    <td style={{ color: '#059669', fontWeight: 600 }}>{(feeData.collected || 0).toLocaleString()}</td>
                                                    <td style={{ color: feeData.pending > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>{(feeData.pending || 0).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
