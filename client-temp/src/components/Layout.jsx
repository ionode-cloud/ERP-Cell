import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen,
    IndianRupee, ClipboardCheck, LogOut, Menu, X, ChevronRight,
    PenLine, Award
} from 'lucide-react';
import { useState } from 'react';

const adminNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: GraduationCap, label: 'Students' },
    { to: '/teachers', icon: Users, label: 'Teachers' },
    { to: '/branches', icon: BookOpen, label: 'Branches' },
    { to: '/fees', icon: IndianRupee, label: 'Fees' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
];

const teacherNav = [
    { to: '/teacher-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/create-class', icon: PenLine, label: 'Create Class' },
    { to: '/marks', icon: Award, label: 'Marks' },
    { to: '/students', icon: GraduationCap, label: 'Students' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
];


const studentNav = [
    { to: '/student-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-fees', icon: IndianRupee, label: 'My Fees' },
    { to: '/my-attendance', icon: ClipboardCheck, label: 'My Attendance' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(true);

    const navItems = user?.role === 'admin' ? adminNav
        : user?.role === 'teacher' ? teacherNav
            : studentNav;

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="layout">
            <aside className={`sidebar ${open ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-header">
                    {open && <span className="sidebar-logo">🎓 College ERP</span>}
                    <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {open && user && (
                    <div className="sidebar-user">
                        <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                        <div>
                            <div className="user-name">{user.name}</div>
                            <div className="user-role">{user.role}</div>
                        </div>
                    </div>
                )}

                <nav className="sidebar-nav">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                        >
                            <Icon size={20} />
                            {open && <span>{label}</span>}
                            {open && <ChevronRight size={14} className="ml-auto" />}
                        </NavLink>
                    ))}
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    {open && <span>Logout</span>}
                </button>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
