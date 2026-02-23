import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    BarChart3,
    Settings,
    Monitor,
    LogOut
} from 'lucide-react';
import { useData } from '../context/DataContext';

const Sidebar = () => {
    const { currentUser, logout } = useData();
    const [now, setNow] = useState(new Date());
    const [logoError, setLogoError] = useState(false);
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000 * 60);
        return () => clearInterval(id);
    }, []);

    const day = now.toLocaleDateString(undefined, { weekday: 'long' });
    const date = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {!logoError ? (
                        <img
                            src="/logo.png"
                            alt="Logo"
                            style={{
                                width: '80px',
                                height: '80px',
                                objectFit: 'contain',
                                mixBlendMode: 'multiply',
                                transform: 'scale(1.8)',
                                marginBottom: '5px'
                            }}
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="logo-square" style={{ width: '60px', height: '60px', backgroundColor: '#064E3B', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Monitor size={32} color="white" />
                        </div>
                    )}
                    <div className="logo-details">
                        <h2 className="brand-name" style={{ fontSize: '24px' }}>Mithun Cards</h2>
                        <p className="brand-subtitle">Billing Software</p>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={20} />
                    <span>Home</span>
                </NavLink>
                <NavLink
                    to="/orders"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <ShoppingCart size={20} />
                    <span>Orders</span>
                </NavLink>
                <NavLink
                    to="/customers"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Users size={20} />
                    <span>Customers</span>
                </NavLink>
                <NavLink
                    to="/inventory"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Package size={20} />
                    <span>Inventory</span>
                </NavLink>
                <NavLink
                    to="/reports"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <BarChart3 size={20} />
                    <span>Reports</span>
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="card" style={{ margin: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }}>
                    <div style={{ fontSize: '18px', opacity: 0.9 }}>{day}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>{date} {month}</div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>{hours}:{minutes}</div>
                    </div>
                </div>
                {/* User profile can be passed as props or static for now */}
                <div className="user-profile">
                    <div className="user-info">
                        <p className="user-name">{currentUser?.name || 'User'}</p>
                        <button onClick={logout} className="logout-btn">
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
