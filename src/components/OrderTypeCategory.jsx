import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Plus, Minus, Trash2, Save, ArrowLeft, FolderOpen } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useData } from '../context/DataContext';

const OrderTypeCategory = () => {
    const { typeId, subId } = useParams();
    const navigate = useNavigate();
    const { inventory, customers, orders, cardTypes, getSubcategories, addOrder, updateOrder, deleteOrder, settings } = useData();

    const isAllTypes = typeId === 'all';
    const [subcategories, setSubcategories] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(false);

    const cardType = isAllTypes ? null : cardTypes.find(ct => ct.id === parseInt(typeId));
    const title = isAllTypes ? 'New Bill' : (cardType?.name || 'Order');

    useEffect(() => {
        if (!isAllTypes && typeId) {
            loadSubcategories();
        }
    }, [typeId]);

    const loadSubcategories = async () => {
        setLoadingSubs(true);
        const data = await getSubcategories(typeId);
        setSubcategories(data);
        setLoadingSubs(false);
    };

    const currentSubcategory = subId ? subcategories.find(s => s.id === parseInt(subId)) : null;

    // Filter inventory items by subcategory
    const filteredProducts = subId
        ? inventory.filter(item => item.subcategory_id === parseInt(subId))
        : [];

    const [isNewCustomer, setIsNewCustomer] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [orderStatus, setOrderStatus] = useState('Pending');
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [discount, setDiscount] = useState(0);
    const [includeGST, setIncludeGST] = useState(true);
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [customPaymentMethod, setCustomPaymentMethod] = useState('');
    const [amountPaid, setAmountPaid] = useState(0);

    const resetForm = () => {
        setIsNewCustomer(true);
        setSelectedCustomer('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setOrderDate(new Date().toISOString().split('T')[0]);
        setOrderStatus('Pending');
        setSelectedItems([]);
        setDiscount(0);
        setAmountPaid(0);
        setPaymentMethod('Cash');
        setCustomPaymentMethod('');
    };

    const handleAddItem = (item) => {
        const existingItem = selectedItems.find(i => i.id === item.id);
        if (existingItem) {
            setSelectedItems(selectedItems.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
        }
    };

    const handleRemoveItem = (itemId) => {
        setSelectedItems(selectedItems.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId, change) => {
        setSelectedItems(selectedItems.map(i => {
            if (i.id === itemId) {
                const newQuantity = Math.max(1, i.quantity + change);
                return { ...i, quantity: newQuantity };
            }
            return i;
        }));
    };

    const getCurrencySymbol = () => {
        if (settings.currency === 'INR') return '₹';
        if (settings.currency === 'USD') return '$';
        return settings.currency;
    };

    const calculateSubtotal = () => {
        return selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    };

    const calculateTax = (subtotal) => {
        const tr = settings?.taxRate || 8.25;
        return includeGST ? subtotal * (tr / 100) : 0;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = calculateTax(subtotal);
        return subtotal + tax - discount;
    };

    const calculateBalance = () => {
        return calculateTotal() - amountPaid;
    };

    const handleSaveOrder = async () => {
        const finalCustomerName = isNewCustomer ? customerName.trim() : selectedCustomer;
        if (!finalCustomerName || selectedItems.length === 0) {
            alert('Please select/enter customer name and add items.');
            return;
        }
        if (isNewCustomer && !customerPhone.trim()) {
            alert('Please enter mobile number.');
            return;
        }

        const orderData = {
            items: selectedItems,
            advance_paid: amountPaid,
            payment_method: paymentMethod === 'Others' ? customPaymentMethod : paymentMethod,
            status: amountPaid >= calculateTotal() ? 'Paid' : 'Pending'
        };

        if (isNewCustomer) {
            orderData.customerName = customerName.trim();
            orderData.customerPhone = customerPhone.trim();
            orderData.customerEmail = customerEmail.trim();
        } else {
            const customer = customers.find(c => c.name === selectedCustomer);
            orderData.customerId = customer?.id;
        }

        try {
            const subtotal = calculateSubtotal();
            const tax = calculateTax(subtotal);
            const total = calculateTotal();

            let finalOrder = await addOrder(orderData);

            setInvoiceOrder({
                ...finalOrder,
                subtotal: subtotal,
                tax: tax,
                discount: discount,
                amount: total,
                balance_due: total - amountPaid,
                advance_paid: amountPaid
            });

            setShowInvoice(true);
            resetForm();
        } catch (error) {
            alert('Error saving order: ' + (error.message || 'Unknown error'));
        }
    };

    // ── Breadcrumb back navigation ──
    const handleBack = () => {
        if (subId) {
            // Go back from products to subcategories
            navigate(`/orders/new/type/${typeId}`);
        } else if (!isAllTypes) {
            // Go back from subcategories to product types (all) or New Order
            navigate('/orders/new/type/all');
        } else {
            // Go back from all types to New Order
            navigate('/orders/new');
        }
    };

    // ── Build breadcrumb text ──
    const getBreadcrumb = () => {
        let crumb = 'New Order';
        if (isAllTypes && !subId) {
            crumb += ' → Select Product Type';
        } else if (!isAllTypes && !subId) {
            crumb += ` → ${title}`;
        } else if (subId) {
            crumb += ` → ${title} → ${currentSubcategory?.name || 'Products'}`;
        }
        return crumb;
    };

    // ── Icon colors for product types ──
    const iconColors = ['blue', 'indigo', 'purple', 'pink', 'green', 'orange', 'teal', 'red'];

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="dashboard-content">
                    {/* Breadcrumb Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <button
                            onClick={handleBack}
                            style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                                {getBreadcrumb()}
                            </p>
                            <h1 className="page-title" style={{ margin: 0 }}>
                                {isAllTypes && !subId
                                    ? 'Select Product Type'
                                    : subId
                                        ? currentSubcategory?.name || 'Products'
                                        : title}
                            </h1>
                        </div>
                    </div>

                    {/* ──────── Level 1: Show all product types (when typeId === 'all') ──────── */}
                    {isAllTypes && !subId ? (
                        <div className="card">
                            <div className="actions-grid">
                                {cardTypes.map((ct, index) => (
                                    <button key={ct.id} className="action-btn" onClick={() => navigate(`/orders/new/type/${ct.id}`)}>
                                        <div className={`action-icon ${iconColors[index % iconColors.length]}`}><FolderOpen size={20} /></div>
                                        <span>{ct.name}</span>
                                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{ct.subcategories_count || 0} subcategories</span>
                                    </button>
                                ))}
                                {cardTypes.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                                        <FolderOpen size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                        <p style={{ fontWeight: '500', marginBottom: '6px' }}>No product types created yet</p>
                                        <p style={{ fontSize: '13px' }}>Go to Inventory → Add Product Type to create categories first.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        /* ──────── Level 2: Show subcategories ──────── */
                    ) : !subId ? (
                        <div className="card">
                            {loadingSubs ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Loading subcategories...</div>
                            ) : (
                                <div className="actions-grid">
                                    {subcategories.map(sub => (
                                        <button key={sub.id} className="action-btn" onClick={() => navigate(`/orders/new/type/${typeId}/sub/${sub.id}`)}>
                                            <span>{sub.name}</span>
                                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{sub.inventory_items_count || 0} products</span>
                                        </button>
                                    ))}
                                    {subcategories.length === 0 && (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                                            <p style={{ fontWeight: '500', marginBottom: '6px' }}>No subcategories in "{title}" yet</p>
                                            <p style={{ fontSize: '13px' }}>Go to Inventory → {title} → Add Subcategory first.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        /* ──────── Level 3: Show products + order form ──────── */
                    ) : (
                        <div className="new-order-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
                            <div className="order-selection-area">
                                <div className="search-bar-container">
                                    <div className="search-bar-enhanced">
                                        <Search size={22} className="search-icon-enhanced" />
                                        <input
                                            type="text"
                                            placeholder={`Search ${currentSubcategory?.name || 'products'}...`}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="search-input-enhanced"
                                        />
                                        {searchQuery && (
                                            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
                                        )}
                                    </div>
                                </div>

                                <div className="products-grid">
                                    {filteredProducts
                                        .filter(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(item => (
                                            <div key={item.id} className="product-card" onClick={() => handleAddItem(item)}>
                                                {item.image && (
                                                    <div className="product-image-thumb">
                                                        <img src={item.image} alt={item.title} loading="lazy" />
                                                    </div>
                                                )}
                                                <div className="product-info">
                                                    <h4>{item.title || 'Untitled'}</h4>
                                                    <p className="price">{getCurrencySymbol()} {parseFloat(item.price || 0).toFixed(2)}</p>
                                                    <span className={`stock-badge ${item.status === 'In Stock' ? 'success' : 'warning'}`}>
                                                        {item.stock ?? 0} in stock
                                                    </span>
                                                </div>
                                                <button className="add-btn"><Plus size={18} /></button>
                                            </div>
                                        ))}
                                    {filteredProducts.filter(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                        <div className="card" style={{ gridColumn: '1 / -1' }}>
                                            <p style={{ color: '#6B7280' }}>No products found in this subcategory. Add products in Inventory first.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Summary Panel */}
                            <div className="order-summary-panel">
                                <div className="panel-header">
                                    <h3>Order Details</h3>
                                    <span className="order-id">New Order</span>
                                </div>

                                <div className="customer-type-toggle">
                                    <label className="radio-option">
                                        <input type="radio" name="customerType" checked={!isNewCustomer} onChange={() => setIsNewCustomer(false)} />
                                        <span>Select Existing</span>
                                    </label>
                                    <label className="radio-option">
                                        <input type="radio" name="customerType" checked={isNewCustomer} onChange={() => setIsNewCustomer(true)} />
                                        <span>New Customer</span>
                                    </label>
                                </div>

                                {!isNewCustomer ? (
                                    <div className="customer-select-section">
                                        <label>Customer *</label>
                                        <select className="form-select" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                                            <option value="">Choose customer</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="customer-input-section">
                                            <label>Name *</label>
                                            <input type="text" className="form-input" placeholder="Enter name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                        </div>
                                        <div className="customer-input-section" style={{ marginTop: '12px' }}>
                                            <label>Phone *</label>
                                            <input type="tel" className="form-input" placeholder="Enter mobile number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                                        </div>
                                        <div className="customer-input-section" style={{ marginTop: '12px' }}>
                                            <label>Email</label>
                                            <input type="email" className="form-input" placeholder="Email (optional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                                        </div>
                                    </>
                                )}

                                <div className="order-status-select" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" id="include-gst" checked={includeGST} onChange={(e) => setIncludeGST(e.target.checked)} />
                                    <label htmlFor="include-gst">Include GST</label>
                                </div>

                                <div className="selected-items-list">
                                    {selectedItems.length === 0 ? (
                                        <div className="empty-state"><p>No items added yet</p></div>
                                    ) : (
                                        selectedItems.map(item => (
                                            <div key={item.id} className="order-item">
                                                <div className="item-details">
                                                    <h4>{item.title || 'Untitled'}</h4>
                                                    <p>{getCurrencySymbol()} {parseFloat(item.price || 0).toFixed(2)} x {item.quantity}</p>
                                                </div>
                                                <div className="item-actions">
                                                    <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                                                    <button className="delete-btn" onClick={() => handleRemoveItem(item.id)}><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="pricing-breakdown">
                                    <div className="row"><span>Subtotal</span><span>{getCurrencySymbol()} {calculateSubtotal().toFixed(2)}</span></div>
                                    <div className="row"><span>Tax</span><span>{getCurrencySymbol()} {calculateTax(calculateSubtotal()).toFixed(2)}</span></div>
                                    <div className="row">
                                        <span>Discount</span>
                                        <input type="number" className="discount-input" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: '80px', textAlign: 'right' }} />
                                    </div>
                                    <div className="total-row"><span>Total</span><span>{getCurrencySymbol()} {calculateTotal().toFixed(2)}</span></div>

                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                                        <div className="row" style={{ marginBottom: '12px' }}>
                                            <span>Payment Method</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                <select
                                                    className="form-select"
                                                    style={{ width: '120px', padding: '4px 8px', fontSize: '13px' }}
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="Online">Online</option>
                                                    <option value="Others">Others</option>
                                                </select>
                                                {paymentMethod === 'Others' && (
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Specify method"
                                                        style={{ width: '120px', padding: '4px 8px', fontSize: '13px' }}
                                                        value={customPaymentMethod}
                                                        onChange={(e) => setCustomPaymentMethod(e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="row" style={{ marginBottom: '12px' }}>
                                            <span>Paid Amount</span>
                                            <input
                                                type="number"
                                                className="discount-input"
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                                style={{ width: '120px', textAlign: 'right', fontWeight: '600', color: '#059669' }}
                                            />
                                        </div>

                                        <div className="row" style={{ fontWeight: '700', color: calculateBalance() > 0 ? '#DC2626' : '#059669' }}>
                                            <span>Balance Due</span>
                                            <span>{getCurrencySymbol()} {calculateBalance().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="action-buttons">
                                    <button className="btn-secondary" onClick={resetForm}>Cancel</button>
                                    <button className="btn-primary" onClick={handleSaveOrder}>
                                        <Save size={18} />
                                        <span>Confirm Order</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoice Modal */}
                    {showInvoice && invoiceOrder && (
                        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                            <div className="modal-content" style={{ position: 'relative', backgroundColor: 'white', padding: 0, borderRadius: '12px', width: '850px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                                <button
                                    onClick={() => setShowInvoice(false)}
                                    style={{
                                        position: 'absolute', top: '15px', right: '15px', zIndex: 1100,
                                        fontSize: '32px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: '#F3F4F6', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#374151',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s', lineHeight: 0, paddingBottom: '5px'
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#E5E7EB'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                                >&times;</button>
                                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, borderRadius: '12px' }}>
                                    <div id="invoice-content" style={{ padding: '30px 40px', backgroundColor: '#fff', color: '#111827', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', minHeight: '275mm', boxSizing: 'border-box' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '20px', marginBottom: '30px', alignItems: 'center' }}>
                                                <div>
                                                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.025em' }}>{settings?.companyName || 'Mithun Cards'}</h1>
                                                    <p style={{ margin: '4px 0 0', color: '#4B5563', fontSize: '14px' }}>Premium Printing & Design Solutions</p>
                                                </div>
                                                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    <img src="/logo.png" alt="Logo" style={{ height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} onError={(e) => e.target.style.display = 'none'} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', marginBottom: '8px', letterSpacing: '0.05em' }}>Bill To</h4>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#111827' }}>{invoiceOrder.customer}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <p style={{ margin: 0, color: '#4B5563', fontSize: '13px', fontWeight: 600 }}>Invoice #: <span style={{ color: '#111827' }}>{invoiceOrder.id}</span></p>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#4B5563' }}><span style={{ fontWeight: 600, color: '#111827' }}>Date:</span> {invoiceOrder.date}</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#4B5563' }}><span style={{ fontWeight: 600, color: '#111827' }}>Category:</span> {title}{currentSubcategory ? ` > ${currentSubcategory.name}` : ''}</p>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '30px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', borderBottom: '2px solid #111827' }}>
                                                            <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#4B5563' }}>Item Description</th>
                                                            <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#4B5563' }}>Price</th>
                                                            <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#4B5563' }}>Qty</th>
                                                            <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#4B5563' }}>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(invoiceOrder.items || []).map((item) => (
                                                            <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                                                <td style={{ padding: '16px 10px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>{item.title}</td>
                                                                <td style={{ textAlign: 'right', padding: '16px 10px', fontSize: '14px', color: '#4B5563' }}>{getCurrencySymbol()} {parseFloat(item.price).toFixed(2)}</td>
                                                                <td style={{ textAlign: 'center', padding: '16px 10px', fontSize: '14px', color: '#4B5563' }}>{item.quantity}</td>
                                                                <td style={{ textAlign: 'right', padding: '16px 10px', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{getCurrencySymbol()} {(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '2px solid #111827', paddingTop: '20px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                                <div>
                                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px 0', textTransform: 'uppercase', fontWeight: 600 }}>Notes</p>
                                                    <p style={{ fontSize: '13px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>Please check the items before leaving. Goods once sold will not be taken back.</p>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                                                        <span style={{ fontSize: '14px', color: '#4B5563' }}>Subtotal</span>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{getCurrencySymbol()} {(invoiceOrder.subtotal || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                                                        <span style={{ fontSize: '14px', color: '#4B5563' }}>Tax (GST)</span>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>+ {getCurrencySymbol()} {(invoiceOrder.tax || 0).toFixed(2)}</span>
                                                    </div>
                                                    {invoiceOrder.discount > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                                                            <span style={{ fontSize: '14px', color: '#4B5563' }}>Discount</span>
                                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626' }}>- {getCurrencySymbol()} {(invoiceOrder.discount || 0).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0 0' }}>
                                                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>Total Amount</span>
                                                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{getCurrencySymbol()} {invoiceOrder.amount.toFixed(2)}</span>
                                                    </div>
                                                    {invoiceOrder.advance_paid > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#059669' }}>
                                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Amount Paid</span>
                                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>- {getCurrencySymbol()} {(invoiceOrder.advance_paid || 0).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {invoiceOrder.balance_due > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px dashed #E5E7EB', marginTop: '5px' }}>
                                                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626' }}>Balance Due</span>
                                                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626' }}>{getCurrencySymbol()} {(invoiceOrder.balance_due || 0).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '40px', borderTop: '1px solid #E5E7EB', paddingTop: '15px', textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thank you for your business!</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                        <button className="btn-primary" onClick={() => {
                                            const element = document.getElementById('invoice-content');
                                            html2pdf().set({
                                                margin: 5,
                                                filename: `Invoice_${invoiceOrder.id}.pdf`,
                                                image: { type: 'jpeg', quality: 1 },
                                                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                            }).from(element).save();
                                        }}>Download PDF</button>
                                        <button className="btn-outline" onClick={() => {
                                            const msg = `Invoice ${invoiceOrder.id}\nCustomer: ${invoiceOrder.customer}\nTotal: ${(invoiceOrder.amount || 0).toFixed(2)} ${getCurrencySymbol()}`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}>Share WhatsApp</button>
                                        <button className="btn-secondary" onClick={() => {
                                            const printWindow = window.open('', '_blank');
                                            printWindow.document.write(`<html><head><title>Invoice ${invoiceOrder.id}</title></head><body>${document.getElementById('invoice-content').outerHTML}<script>window.onload=()=>window.print()<\/script></body></html>`);
                                            printWindow.document.close();
                                        }}>Print</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OrderTypeCategory;
