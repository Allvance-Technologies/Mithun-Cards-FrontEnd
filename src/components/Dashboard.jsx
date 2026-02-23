import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useData } from '../context/DataContext';
import {
    Search,
    Plus,
    Bell,
    UserCircle,
    UserPlus,
    ClipboardList,
    ShoppingBag,
    AlertTriangle,
    AlertCircle,
    Wallet,
    Receipt
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { orders, inventory, settings } = useData();

    // Get Low Stock Items
    const lowStockItems = inventory.filter(item => item.stock < 20);

    // Get Recent Orders (Top 5)
    const recentOrders = orders.slice(0, 5);

    return (
        <div className="dashboard-container">
            <Sidebar />

            {/* Main Content */}
            <main className="main-content">

                <div className="dashboard-content">
                    <h1 className="page-title">Home</h1>



                    <div className="dashboard-grid">

                        {/* Quick Actions */}
                        <div className="card actions-card">
                            <div className="card-header">
                                <h3>Quick Actions</h3>
                            </div>
                            <div className="actions-grid">
                                <button className="action-btn" onClick={() => navigate('/orders/new')}>
                                    <div className="action-icon blue">
                                        <Plus size={20} />
                                    </div>
                                    <span>New Order</span>
                                </button>
                                <button className="action-btn" onClick={() => navigate('/expenditure')}>
                                    <div className="action-icon indigo">
                                        <Wallet size={20} />
                                    </div>
                                    <span>Expenditure</span>
                                </button>
                                <button className="action-btn" onClick={() => navigate('/orders/new/new-bill')}>
                                    <div className="action-icon purple">
                                        <Receipt size={20} />
                                    </div>
                                    <span>New Bill</span>
                                </button>
                                <button className="action-btn" onClick={() => navigate('/inventory')}>
                                    <div className="action-icon pink">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <span>New Product</span>
                                </button>
                            </div>
                        </div>



                        {/* Low Stock Alerts */}
                        <div className="card alerts-card">
                            <div className="card-header">
                                <h3>Low Stock Alerts</h3>
                            </div>
                            <div className="alerts-list">
                                {lowStockItems.length > 0 ? (
                                    lowStockItems.map(item => (
                                        <div key={item.id} className="alert-item">
                                            {item.stock === 0 ? (
                                                <AlertCircle className="alert-icon danger" size={20} />
                                            ) : (
                                                <AlertTriangle className="alert-icon warning" size={20} />
                                            )}
                                            <div className="alert-details">
                                                <h4>{item.title}</h4>
                                                <p>{item.stock} remaining</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '12px', color: '#6B7280', fontSize: '16px' }}>All items are well stocked.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card orders-card" style={{ marginTop: '24px' }}>
                        <div className="card-header flex-header">
                            <h3>Recent Orders</h3>
                            <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); navigate('/reports'); }}>View All</a>
                        </div>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length > 0 ? (
                                    recentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td>{order.customer}</td>
                                            <td>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {order.amount}</td>
                                            <td>
                                                <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>No orders yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
