import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [inventory, setInventory] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [cardTypes, setCardTypes] = useState([]);
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
            const [ordersRes, inventoryRes, customersRes, cardTypesRes] = await Promise.all([
                api.get('orders'),
                api.get('inventory'),
                api.get('customers').catch(() => ({ data: { data: [] } })),
                api.get('card-types').catch(() => ({ data: [] }))
            ]);

            // Map inventory - handle both array and { data: [...] } response formats
            const rawInventory = Array.isArray(inventoryRes.data) ? inventoryRes.data : (inventoryRes.data?.data || []);
            const mappedInventory = rawInventory.map(item => ({
                id: item.id,
                title: item.item_name || '',
                category: item.category || '',
                subcategory_id: item.subcategory_id || null,
                stock: item.stock_quantity ?? 0,
                price: item.cost_per_unit ?? 0,
                status: item.is_low_stock ? 'Low Stock' : (item.stock_quantity === 0 ? 'Out of Stock' : 'In Stock'),
                image: item.image_url || item.image || null
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
            setCardTypes(cardTypesRes.data || []);
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
            // API returns { status, message, data: {...} }
            const raw = response.data?.data || response.data;
            const mappedItem = {
                id: raw.id,
                title: raw.item_name || '',
                category: raw.category || '',
                subcategory_id: raw.subcategory_id || null,
                stock: raw.stock_quantity ?? 0,
                price: raw.cost_per_unit ?? 0,
                status: raw.is_low_stock ? 'Low Stock' : (raw.stock_quantity === 0 ? 'Out of Stock' : 'In Stock'),
                image: raw.image_url || raw.image || null
            };
            setInventory([...inventory, mappedItem]);
            return mappedItem;
        } catch (error) {
            console.error('Add inventory error:', error);
            throw error;
        }
    };

    const updateInventoryItem = async (id, item) => {
        try {
            const response = await api.put(`inventory/${id}`, item);
            // API returns { status, message, data: {...} }
            const raw = response.data?.data || response.data;
            const mappedItem = {
                id: raw.id,
                title: raw.item_name || '',
                category: raw.category || '',
                subcategory_id: raw.subcategory_id || null,
                stock: raw.stock_quantity ?? 0,
                price: raw.cost_per_unit ?? 0,
                status: raw.is_low_stock ? 'Low Stock' : (raw.stock_quantity === 0 ? 'Out of Stock' : 'In Stock'),
                image: raw.image_url || raw.image || null
            };
            setInventory(inventory.map(i => i.id === id ? mappedItem : i));
            return mappedItem;
        } catch (error) {
            console.error('Update inventory error:', error);
            throw error;
        }
    };

    const deleteInventoryItem = async (id) => {
        try {
            await api.delete(`inventory/${id}`);
            setInventory(inventory.filter(i => i.id !== id));
            return { success: true };
        } catch (error) {
            console.error('Delete inventory error:', error);
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

    // Card Types CRUD
    const addCardType = async (data) => {
        try {
            const response = await api.post('card-types', data);
            setCardTypes(prev => [...prev, response.data]);
            return response.data;
        } catch (error) {
            console.error('Add card type error:', error);
            throw error;
        }
    };

    const updateCardType = async (id, data) => {
        try {
            const response = await api.put(`card-types/${id}`, data);
            setCardTypes(prev => prev.map(ct => ct.id === id ? response.data : ct));
            return response.data;
        } catch (error) {
            console.error('Update card type error:', error);
            throw error;
        }
    };

    const deleteCardType = async (id) => {
        try {
            await api.delete(`card-types/${id}`);
            setCardTypes(prev => prev.filter(ct => ct.id !== id));
            return { success: true };
        } catch (error) {
            console.error('Delete card type error:', error);
            throw error;
        }
    };

    // Subcategory CRUD
    const getSubcategories = async (cardTypeId) => {
        try {
            const response = await api.get(`card-types/${cardTypeId}/subcategories`);
            return response.data || [];
        } catch (error) {
            console.error('Get subcategories error:', error);
            return [];
        }
    };

    const addSubcategory = async (cardTypeId, data) => {
        try {
            const response = await api.post(`card-types/${cardTypeId}/subcategories`, data);
            return response.data;
        } catch (error) {
            console.error('Add subcategory error:', error);
            throw error;
        }
    };

    const updateSubcategory = async (cardTypeId, subId, data) => {
        try {
            const response = await api.put(`card-types/${cardTypeId}/subcategories/${subId}`, data);
            return response.data;
        } catch (error) {
            console.error('Update subcategory error:', error);
            throw error;
        }
    };

    const deleteSubcategory = async (cardTypeId, subId) => {
        try {
            await api.delete(`card-types/${cardTypeId}/subcategories/${subId}`);
            return { success: true };
        } catch (error) {
            console.error('Delete subcategory error:', error);
            throw error;
        }
    };

    return (
        <DataContext.Provider value={{
            inventory,
            customers,
            orders,
            settings,
            expenses,
            cardTypes,
            loading,
            addOrder,
            updateOrder,
            deleteOrder,
            deleteCustomer,
            addInventoryItem,
            updateInventoryItem,
            deleteInventoryItem,
            addCardType,
            updateCardType,
            deleteCardType,
            getSubcategories,
            addSubcategory,
            updateSubcategory,
            deleteSubcategory,
            updateSettings,
            currentUser,
            login,
            logout
        }}>
            {children}
        </DataContext.Provider>
    );
};
