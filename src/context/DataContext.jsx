import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [inventory, setInventory] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('settings');
        return saved ? JSON.parse(saved) : {
            companyName: 'Mithun Cards',
            currency: 'USD',
            taxRate: 8.25,
            taxMode: 'exclusive',
            theme: 'system',
        };
    });

    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });

    // Fetch initial data when currentUser changes
    useEffect(() => {
        if (currentUser) {
            fetchDashboardData();
        }
    }, [currentUser]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [ordersRes, inventoryRes, customersRes] = await Promise.all([
                api.get('orders'),
                api.get('inventory'),
                api.get('customers').catch(() => ({ data: { data: [] } }))
            ]);

            // Map inventory
            const mappedInventory = (inventoryRes.data || []).map(item => ({
                id: item.id,
                title: item.item_name,
                stock: item.stock_quantity,
                price: item.cost_per_unit,
                status: item.is_low_stock ? 'Low Stock' : (item.stock_quantity === 0 ? 'Out of Stock' : 'In Stock'),
                image: item.image || null
            }));

            // Map orders
            const mappedOrders = (ordersRes.data || []).map(order => ({
                id: order.id,
                customer: order.customer?.name || 'N/A',
                date: (order.created_at || "").split('T')[0],
                amount: order.total,
                status: order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : 'Pending',
                subtotal: order.subtotal,
                tax: order.tax,
                advance_paid: order.advance_paid,
                balance_due: order.balance_due,
                items: (order.items || []).map(item => ({
                    id: item.id,
                    title: item.product_name || item.title,
                    price: item.unit_price || item.price,
                    quantity: item.quantity,
                    total: item.total_price || (item.unit_price * item.quantity)
                }))
            }));

            // Map customers
            const mappedCustomers = (customersRes.data || []).map(c => ({
                id: c.id,
                name: c.name,
                email: c.email || 'N/A',
                phone: c.phone || 'N/A',
                orders: c.orders_count || 0,
                status: 'Active' // Defaulting since it's not in the DB
            }));

            setOrders(mappedOrders);
            setInventory(mappedInventory);
            setCustomers(mappedCustomers);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await api.post('login', { username, password });

            // The api service already returns response.data via interceptor
            // So response here is { status: true, message: '...', data: { user, token } }
            if (response.status && response.data) {
                const { user, token } = response.data;

                localStorage.setItem('token', token);
                localStorage.setItem('currentUser', JSON.stringify(user));
                setCurrentUser(user);

                return { success: true };
            } else {
                return { success: false, message: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error details:', error);
            const message = error.message || (typeof error === 'string' ? error : 'Login failed');
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await api.post('logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
        }
    };

    const addOrder = async (orderData) => {
        try {
            let customerId = orderData.customerId;

            // Handle New Customer
            if (!customerId && orderData.customerName) {
                const customerRes = await api.post('customers', {
                    name: orderData.customerName,
                    phone: orderData.customerPhone,
                    email: orderData.customerEmail,
                });
                const newCustomer = customerRes.data;
                customerId = newCustomer.id;
                // Add to local state
                setCustomers([...customers, {
                    id: newCustomer.id,
                    name: newCustomer.name,
                    email: newCustomer.email,
                    phone: newCustomer.phone
                }]);
            }

            const backendOrderData = {
                customer_id: customerId,
                advance_paid: orderData.advance_paid || 0,
                items: orderData.items.map(item => ({
                    product_name: item.title,
                    quantity: item.quantity,
                    unit_price: item.price
                }))
            };

            const response = await api.post('orders', backendOrderData);
            const returnedOrder = response.data;

            // Map back to frontend structure
            const newOrder = {
                id: returnedOrder.id,
                customer: returnedOrder.customer?.name || 'N/A',
                date: (returnedOrder.created_at || "").split('T')[0],
                amount: returnedOrder.total,
                status: returnedOrder.status ? (returnedOrder.status.charAt(0).toUpperCase() + returnedOrder.status.slice(1)) : 'Pending',
                items: (returnedOrder.items || []).map(i => ({
                    id: i.id,
                    title: i.product_name,
                    price: i.unit_price,
                    quantity: i.quantity,
                    total: i.total_price
                }))
            };

            setOrders([newOrder, ...orders]);
            return newOrder;
        } catch (error) {
            console.error('Add order error:', error);
            throw error;
        }
    };

    const updateOrder = async (orderId, orderData) => {
        try {
            let customerId = orderData.customerId;

            // Handle New Customer
            if (!customerId && orderData.customerName) {
                const customerRes = await api.post('customers', {
                    name: orderData.customerName,
                    phone: orderData.customerPhone,
                    email: orderData.customerEmail,
                });
                customerId = customerRes.data.id;
                setCustomers(prev => [...prev, {
                    id: customerRes.data.id,
                    name: customerRes.data.name,
                    email: customerRes.data.email,
                    phone: customerRes.data.phone
                }]);
            }

            const backendOrderData = {
                customer_id: customerId,
                advance_paid: orderData.advance_paid || 0,
                status: orderData.status?.toLowerCase() || 'pending',
                items: orderData.items.map(item => ({
                    product_name: item.title,
                    quantity: item.quantity,
                    unit_price: item.price
                }))
            };

            const response = await api.put(`orders/${orderId}`, backendOrderData);
            const returnedOrder = response.data;

            // Map back to frontend structure
            const updatedOrder = {
                id: returnedOrder.id,
                customer: returnedOrder.customer?.name || 'N/A',
                date: (returnedOrder.created_at || "").split('T')[0],
                amount: returnedOrder.total,
                status: returnedOrder.status ? (returnedOrder.status.charAt(0).toUpperCase() + returnedOrder.status.slice(1)) : 'Pending',
                subtotal: returnedOrder.subtotal,
                tax: returnedOrder.tax,
                advance_paid: returnedOrder.advance_paid,
                balance_due: returnedOrder.balance_due,
                items: (returnedOrder.items || []).map(i => ({
                    id: i.id,
                    title: i.product_name,
                    price: i.unit_price,
                    quantity: i.quantity,
                    total: i.total_price
                }))
            };

            setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
            return updatedOrder;
        } catch (error) {
            console.error('Update order error:', error);
            throw error;
        }
    };

    const addInventoryItem = async (item) => {
        try {
            const response = await api.post('inventory', item);
            const newItem = response.data;
            setInventory([...inventory, newItem]);
            return newItem;
        } catch (error) {
            console.error('Add inventory error:', error);
            throw error;
        }
    };

    const deleteOrder = async (orderId) => {
        try {
            await api.delete(`orders/${orderId}`);
            setOrders(orders.filter(o => o.id !== orderId));
            return { success: true };
        } catch (error) {
            console.error('Delete order error:', error);
            throw error;
        }
    };

    const deleteCustomer = async (customerId) => {
        try {
            await api.delete(`customers/${customerId}`);
            setCustomers(customers.filter(c => c.id !== customerId));
            return { success: true };
        } catch (error) {
            console.error('Delete customer error:', error);
            throw error;
        }
    };

    const updateSettings = (newSettings) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('settings', JSON.stringify(updated));
    };

    return (
        <DataContext.Provider value={{
            inventory,
            customers,
            orders,
            settings,
            expenses,
            loading,
            addOrder,
            updateOrder,
            deleteOrder,
            deleteCustomer,
            addInventoryItem,
            updateSettings,
            currentUser,
            login,
            logout
        }}>
            {children}
        </DataContext.Provider>
    );
};
