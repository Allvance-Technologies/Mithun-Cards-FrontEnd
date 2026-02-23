import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Sidebar from './Sidebar';
import { useData } from '../context/DataContext';
import {
    Download,
    ChevronDown
} from 'lucide-react';

const Reports = () => {
    const { orders, customers, settings } = useData();
    const [timePeriod, setTimePeriod] = useState('monthly'); // daily, monthly, yearly
    const [showPeriodMenu, setShowPeriodMenu] = useState(false);

    // Date Selection State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Filter by time period
    const filterOrdersByPeriod = () => {
        return orders.filter(order => {
            if (timePeriod === 'daily') {
                return order.date === selectedDate;
            }
            if (timePeriod === 'monthly') {
                return order.date.startsWith(selectedMonth);
            }
            if (timePeriod === 'yearly') {
                return order.date.startsWith(selectedYear.toString());
            }
            return true;
        });
    };

    const filteredOrders = filterOrdersByPeriod();

    // Calculate Metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
    const totalOrders = filteredOrders.length;
    const newCustomers = customers.filter(c => {
        // For simplicity, assuming customer join date matches order date logic or just counting 'New' status in filtered period if we had join date.
        // Since we don't have explicit join date filtering in the prompt requirement, we'll keep the simple status check but ideally it should be time-bound.
        // Let's stick to the previous simple logic for now but applied to the whole base or filtered? 
        // The previous logic was `customers.filter(c => c.status === 'New').length`. 
        // Let's refine it to be relevant to the filtered orders if possible, or just keep it simple.
        // We'll keep it simple as "New Customers (Total)" for now to avoid complexity without joinDate data.
        return c.status === 'New';
    }).length;

    // Export Report as Excel
    const handleExportReport = () => {
        const data = filteredOrders.map(order => ({
            'Order ID': order.id,
            'Customer': order.customer,
            'Date': order.date,
            'Amount': order.amount,
            'Status': order.status
        }));

        if (data.length === 0) {
            alert('No data to export for the selected period.');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        const fileName = `Report_${timePeriod}_${timePeriod === 'daily' ? selectedDate : timePeriod === 'monthly' ? selectedMonth : selectedYear}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // Chart Data Preparation
    const getChartData = () => {
        if (timePeriod === 'daily') {
            // No hourly data, so just show a single bar for the day or breakdown by status
            return [
                { label: 'Total', value: totalRevenue, active: true }
            ];
        }

        if (timePeriod === 'monthly') {
            // Days 1-31
            const daysInMonth = new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate();
            const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
                day: i + 1,
                value: 0
            }));

            filteredOrders.forEach(order => {
                const day = parseInt(order.date.split('-')[2]);
                if (dailyData[day - 1]) {
                    dailyData[day - 1].value += parseFloat(order.amount);
                }
            });

            // Normalize for visualization (max height)
            const maxValue = Math.max(...dailyData.map(d => d.value)) || 1;
            return dailyData.map(d => ({
                label: d.day,
                value: d.value,
                height: `${(d.value / maxValue) * 100}%`,
                active: d.value > 0
            }));
        }

        if (timePeriod === 'yearly') {
            // Months Jan-Dec
            const monthlyData = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                label: new Date(0, i).toLocaleString('default', { month: 'short' }),
                value: 0
            }));

            filteredOrders.forEach(order => {
                const month = parseInt(order.date.split('-')[1]);
                if (monthlyData[month - 1]) {
                    monthlyData[month - 1].value += parseFloat(order.amount);
                }
            });

            const maxValue = Math.max(...monthlyData.map(d => d.value)) || 1;
            return monthlyData.map(d => ({
                label: d.label,
                value: d.value,
                height: `${(d.value / maxValue) * 100}%`,
                active: d.value > 0
            }));
        }
        return [];
    };

    const chartData = getChartData();

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">

                <div className="dashboard-content">
                    <div className="page-header">
                        <h1 className="page-title">Reports</h1>
                        <div className="header-actions">
                            <div className="report-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {/* Type Selector */}
                                <div style={{ position: 'relative' }}>
                                    <button className="btn-outline" onClick={() => setShowPeriodMenu(!showPeriodMenu)}>
                                        <span>
                                            {timePeriod === 'daily' && 'Daily'}
                                            {timePeriod === 'monthly' && 'Monthly'}
                                            {timePeriod === 'yearly' && 'Yearly'}
                                        </span>
                                        <ChevronDown size={16} />
                                    </button>
                                    {showPeriodMenu && (
                                        <div className="dropdown-menu">
                                            <button onClick={() => { setTimePeriod('daily'); setShowPeriodMenu(false); }}>Daily</button>
                                            <button onClick={() => { setTimePeriod('monthly'); setShowPeriodMenu(false); }}>Monthly</button>
                                            <button onClick={() => { setTimePeriod('yearly'); setShowPeriodMenu(false); }}>Yearly</button>
                                        </div>
                                    )}
                                </div>

                                {/* Specific Pickers */}
                                {timePeriod === 'daily' && (
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        style={{ width: 'auto' }}
                                    />
                                )}
                                {timePeriod === 'monthly' && (
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        style={{ width: 'auto' }}
                                    />
                                )}
                                {timePeriod === 'yearly' && (
                                    <select
                                        className="form-input"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        style={{ width: 'auto' }}
                                    >
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button className="btn-primary" onClick={handleExportReport} title="Export to Excel">
                                <Download size={18} />
                                <span>Export (Excel)</span>
                            </button>
                        </div>
                    </div>

                    <div className="section-header">
                        <h2>
                            {timePeriod === 'daily' && `Summary for ${selectedDate}`}
                            {timePeriod === 'monthly' && `Summary for ${selectedMonth}`}
                            {timePeriod === 'yearly' && `Summary for ${selectedYear}`}
                        </h2>
                    </div>

                    <div className="summary-grid">
                        <div className="card summary-card">
                            <h3>Total Revenue</h3>
                            <div className="summary-value">{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div className="card summary-card">
                            <h3>Orders Processed</h3>
                            <div className="summary-value">{totalOrders}</div>
                        </div>
                        <div className="card summary-card">
                            <h3>New Customers</h3>
                            <div className="summary-value">{newCustomers}</div>
                        </div>
                    </div>

                    <div className="reports-grid">
                        <div className="card chart-card">
                            <div className="card-header">
                                <h3>Revenue Trend</h3>
                            </div>
                            <div className="chart-area">
                                <div className="chart-bars" style={{ alignItems: 'flex-end', display: 'flex', height: '200px', gap: '4px', paddingBottom: '20px' }}>
                                    {chartData.map((data, index) => (
                                        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                            <div
                                                className={`chart-bar ${data.active ? 'active' : ''}`}
                                                style={{
                                                    height: data.height || '0%',
                                                    width: '100%',
                                                    backgroundColor: data.active ? '#4f46e5' : '#e5e7eb',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.3s ease'
                                                }}
                                                title={`${data.label}: $${data.value.toFixed(2)}`}
                                            ></div>
                                            <span style={{ fontSize: '12px', marginTop: '4px', color: '#6b7280' }}>{data.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="card top-selling-card">
                            <div className="card-header">
                                <h3>Top Selling Cards</h3>
                            </div>
                            <div className="top-list">
                                {/* Mock Data - In real app, aggregate from filteredOrders */}
                                <div className="top-item">
                                    <div className="item-info">
                                        <h4>Classic Wedding</h4>
                                        <p>124 sold</p>
                                    </div>
                                    <span className="rank">#1</span>
                                </div>
                                <div className="top-item">
                                    <div className="item-info">
                                        <h4>Floral Birthday</h4>
                                        <p>98 sold</p>
                                    </div>
                                    <span className="rank">#2</span>
                                </div>
                                <div className="top-item">
                                    <div className="item-info">
                                        <h4>Modern Anniversary</h4>
                                        <p>76 sold</p>
                                    </div>
                                    <span className="rank">#3</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;
