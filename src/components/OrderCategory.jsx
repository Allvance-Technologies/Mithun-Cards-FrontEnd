import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Plus, Minus, Trash2, Save } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useData } from '../context/DataContext';
import { GstInvoice, NonGstInvoice } from './InvoiceTemplates';

const names = {
  'invitation-cards': 'Invitation Cards',
  'bill-books': 'Bill Books',
  'visiting-cards': 'Visiting Cards',
  'posters': 'Posters',
  'new-bill': 'New Bill'
};

const OrderCategory = () => {
  const { category, subtype, orderId } = useParams();
  const navigate = useNavigate();
  const title = names[category] || 'Order Category';
  const { inventory, customers, orders, addOrder, updateOrder, deleteOrder, settings } = useData();

  const filterBySubtype = (list) => {
    if (!subtype) return list;
    const key = subtype.toLowerCase();
    if (key === 'wedding') return list.filter(i => (i.title || '').toLowerCase().includes('wedding'));
    if (key === 'engagement') return list.filter(i => (i.title || '').toLowerCase().includes('engagement'));
    if (key === 'baptism') return list.filter(i => (i.title || '').toLowerCase().includes('baptism'));
    if (key === 'holy-communion') return list.filter(i => (i.title || '').toLowerCase().includes('communion'));
    if (key === 'others') return list.filter(i => !(
      (i.title || '').toLowerCase().includes('wedding') ||
      (i.title || '').toLowerCase().includes('engagement') ||
      (i.title || '').toLowerCase().includes('baptism') ||
      (i.title || '').toLowerCase().includes('communion')
    ));
    return list;
  };

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
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [includeGST, setIncludeGST] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);

  // New fields for specific invoice types
  const [buyerGSTIN, setBuyerGSTIN] = useState('');
  const [despatchDetails, setDespatchDetails] = useState({
    through: '',
    from: '',
    to: '',
    artics: ''
  });

  React.useEffect(() => {
    if (orderId && orders && orders.length > 0) {
      const orderToEdit = orders.find(o => o.id.toString() === orderId.toString());
      if (orderToEdit) {
        setEditingOrderId(orderToEdit.id);
        setIsNewCustomer(false);
        setSelectedCustomer(orderToEdit.customer);
        setOrderDate(orderToEdit.date);
        setOrderStatus(orderToEdit.status);
        setSelectedItems(orderToEdit.items || []);
        setDiscount(orderToEdit.discount || 0);
      }
    }
  }, [orderId, orders]);

  const handleInventorySelect = (e) => {
    const id = e.target.value;
    setSelectedInventoryId(id);
    if (id === 'custom') {
      setQuickTitle('');
      setQuickPrice('');
    } else {
      const item = inventory.find(i => i.id.toString() === id.toString());
      if (item) {
        setQuickTitle(item.title);
        setQuickPrice(item.price);
      }
    }
  };

  const currentLogo = "/src/assets/logo.png";

  const handleAddQuickItem = () => {
    const t = (quickTitle || '').trim();
    const p = parseFloat(quickPrice) || 0;
    const q = Math.max(1, parseInt(quickQty) || 1);

    if (!t && p <= 0) {
      alert('Please enter item name or price.');
      return;
    }

    const newItem = {
      id: `NB-${Date.now()}`,
      title: t || 'Item',
      price: p,
      quantity: q,
      stock: 0,
      status: 'In Stock'
    };

    setSelectedItems([...selectedItems, newItem]);
    setQuickTitle('');
    setQuickPrice('');
    setQuickQty(1);
    setSelectedInventoryId('');
  };

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
    setEditingOrderId(null);
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

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  };

  const calculateTax = (subtotal) => {
    const tr = settings?.taxRate || 8.25;
    return includeGST ? subtotal * (tr / 100) : 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = calculateTax(discountedSubtotal);
    return discountedSubtotal + tax;
  };

  const calculateBalance = () => {
    return calculateTotal() - amountPaid;
  };

  const handleSaveOrder = async () => {
    const finalCustomerName = isNewCustomer ? customerName.trim() : selectedCustomer;
    const itemsForOrder = selectedItems;

    if (!finalCustomerName || itemsForOrder.length === 0) {
      alert('Please select/enter customer name and add items.');
      return;
    }
    if (isNewCustomer && !customerPhone.trim()) {
      alert('Please enter mobile number.');
      return;
    }

    const orderData = {
      items: itemsForOrder,
      subtotal: calculateSubtotal(),
      tax: calculateTax(calculateSubtotal()),
      total: calculateTotal(),
      discount: discount,
      advance_paid: amountPaid,
      payment_method: paymentMethod === 'Others' ? customPaymentMethod : paymentMethod,
      status: amountPaid >= calculateTotal() ? 'Paid' : 'Pending',
      // Add extra fields
      includeGST: includeGST,
      buyerGSTIN: includeGST ? buyerGSTIN : '',
      despatch: includeGST ? despatchDetails : null
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

      let finalOrder;
      if (editingOrderId) {
        finalOrder = await updateOrder(editingOrderId, orderData);
      } else {
        finalOrder = await addOrder(orderData);
      }

      // Ensure the invoice has all calculated fields for display
      setInvoiceOrder({
        ...orderData,
        id: finalOrder.id,
        customer: finalOrder.customer,
        date: finalOrder.date,
        items: finalOrder.items,
        amount: total,
        balance_due: total - amountPaid
      });

      setShowInvoice(true);
      resetForm();
    } catch (error) {
      alert('Error saving order: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-content">
          <h1 className="page-title">{title}</h1>
          {category === 'invitation-cards' ? (
            <div className="new-order-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
              <div className="order-selection-area">
                {!subtype ? (
                  <div className="card">
                    <div className="actions-grid">
                      <button className="action-btn" onClick={() => navigate('/orders/new/invitation-cards/wedding')}>
                        <span>Wedding</span>
                      </button>
                      <button className="action-btn" onClick={() => navigate('/orders/new/invitation-cards/engagement')}>
                        <span>Engagement</span>
                      </button>
                      <button className="action-btn" onClick={() => navigate('/orders/new/invitation-cards/baptism')}>
                        <span>Baptism</span>
                      </button>
                      <button className="action-btn" onClick={() => navigate('/orders/new/invitation-cards/holy-communion')}>
                        <span>Holy Communion</span>
                      </button>
                      <button className="action-btn" onClick={() => navigate('/orders/new/invitation-cards/others')}>
                        <span>Others</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="search-bar-container">
                      <div className="search-bar-enhanced">
                        <Search size={22} className="search-icon-enhanced" />
                        <input
                          type="text"
                          placeholder={`Search ${subtype.replace('-', ' ')} items...`}
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
                      {filterBySubtype(inventory).filter(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                        <div key={item.id} className="product-card" onClick={() => handleAddItem(item)}>
                          {item.image && (
                            <div className="product-image-thumb">
                              <img src={item.image} alt={item.title} />
                            </div>
                          )}
                          <div className="product-info">
                            <h4>{item.title}</h4>
                            <p className="price">{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {parseFloat(item.price).toFixed(2)}</p>
                            <span className={`stock-badge ${item.status === 'In Stock' ? 'success' : 'warning'}`}>
                              {item.stock} in stock
                            </span>
                          </div>
                          <button className="add-btn"><Plus size={18} /></button>
                        </div>
                      ))}
                      {filterBySubtype(inventory).filter(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div className="card" style={{ gridColumn: '1 / -1' }}>
                          <p style={{ color: '#6B7280' }}>No examples available for this category.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="order-summary-panel">
                <div className="panel-header">
                  <h3>Order Details</h3>
                  <span className="order-id">{editingOrderId || 'New Order'}</span>
                </div>
                {category === 'new-bill' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/orders/new')}>Items</button>
                  </div>
                )}

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



                <div className="invoice-mode-selector" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIncludeGST(true)}
                    className={`mode-btn ${includeGST ? 'active' : ''}`}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB',
                      backgroundColor: includeGST ? '#EEF2FF' : '#fff',
                      color: includeGST ? '#4F46E5' : '#6B7280',
                      borderColor: includeGST ? '#4F46E5' : '#E5E7EB',
                      fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    GST Bill
                  </button>
                  <button
                    onClick={() => setIncludeGST(false)}
                    className={`mode-btn ${!includeGST ? 'active' : ''}`}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB',
                      backgroundColor: !includeGST ? '#F0FDF4' : '#fff',
                      color: !includeGST ? '#16A34A' : '#6B7280',
                      borderColor: !includeGST ? '#16A34A' : '#E5E7EB',
                      fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    Non-GST Bill
                  </button>
                </div>

                {includeGST && (
                  <div className="gst-specific-fields" style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#374151' }}>Dispatch & GST Info</h4>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Buyer's GSTIN</label>
                      <input type="text" className="form-input" placeholder="Optional" value={buyerGSTIN} onChange={(e) => setBuyerGSTIN(e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Through</label>
                        <input type="text" className="form-input" placeholder="e.g. Courier" value={despatchDetails.through} onChange={(e) => setDespatchDetails({ ...despatchDetails, through: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Artics</label>
                        <input type="number" className="form-input" placeholder="No. of items" value={despatchDetails.artics} onChange={(e) => setDespatchDetails({ ...despatchDetails, artics: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="selected-items-list">
                  {selectedItems.length === 0 ? (
                    <div className="empty-state"><p>No items added yet</p></div>
                  ) : (
                    selectedItems.map(item => (
                      <div key={item.id} className="order-item">
                        <div className="item-details">
                          <h4>{item.title}</h4>
                          <p>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
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
                  <div className="row"><span>Subtotal</span><span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {calculateSubtotal().toFixed(2)}</span></div>
                  <div className="row"><span>Tax</span><span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {calculateTax(Math.max(0, calculateSubtotal() - discount)).toFixed(2)}</span></div>
                  <div className="row">
                    <span>Discount</span>
                    <input type="number" className="discount-input" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: '80px', textAlign: 'right' }} />
                  </div>
                  <div className="total-row"><span>Total</span><span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {calculateTotal().toFixed(2)}</span></div>

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
                      <span>{calculateBalance() > 0 ? 'Balance Due' : 'Change'}</span>
                      <span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {Math.abs(calculateBalance()).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="action-buttons">
                  <button className="btn-secondary" onClick={resetForm}>Cancel</button>
                  {editingOrderId && (
                    <button
                      className="btn-outline"
                      style={{ borderColor: '#EF4444', color: '#EF4444' }}
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this order?")) {
                          await deleteOrder(editingOrderId);
                          navigate('/orders');
                        }
                      }}
                    >
                      <Trash2 size={18} />
                      <span>Delete Order</span>
                    </button>
                  )}
                  <button className="btn-primary" onClick={handleSaveOrder}>
                    <Save size={18} />
                    <span>{editingOrderId ? 'Update' : 'Confirm Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="new-order-grid" style={{ display: 'grid', gridTemplateColumns: category === 'new-bill' ? '1.2fr' : '1fr 1.2fr', gap: '16px' }}>
              {category !== 'new-bill' && (
                <div className="order-selection-area">
                  <div className="search-bar-container">
                    <div className="search-bar-enhanced">
                      <Search size={22} className="search-icon-enhanced" />
                      <input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()} items...`}
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
                    {inventory.filter(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                      <div key={item.id} className="product-card" onClick={() => handleAddItem(item)}>
                        {item.image && (
                          <div className="product-image-thumb">
                            <img src={item.image} alt={item.title} />
                          </div>
                        )}
                        <div className="product-info">
                          <h4>{item.title}</h4>
                          <p className="price">{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {parseFloat(item.price).toFixed(2)}</p>
                          <span className={`stock-badge ${item.status === 'In Stock' ? 'success' : 'warning'}`}>
                            {item.stock} in stock
                          </span>
                        </div>
                        <button className="add-btn"><Plus size={18} /></button>
                      </div>
                    ))}
                    {inventory.filter(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <p style={{ color: '#6B7280' }}>No products found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="order-summary-panel">
                <div className="panel-header">
                  <h3>Order Details</h3>
                  <span className="order-id">{editingOrderId || 'New Order'}</span>
                </div>

                {category === 'new-bill' && (
                  <div className="customer-input-section" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 0.8fr 0.6fr 0.8fr', gap: '8px', alignItems: 'end', marginBottom: '12px' }}>
                    <div>
                      <label>Select Item</label>
                      <select className="form-select" style={{ fontSize: '13px' }} value={selectedInventoryId} onChange={handleInventorySelect}>
                        <option value="">Choose...</option>
                        <option value="custom">-- Custom Item --</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>{item.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Description</label>
                      <input type="text" className="form-input" placeholder="Item name" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} disabled={selectedInventoryId && selectedInventoryId !== 'custom'} />
                    </div>
                    <div>
                      <label>Price</label>
                      <input type="number" className="form-input no-spinner" placeholder="0.00" value={quickPrice} onChange={(e) => setQuickPrice(e.target.value)} step="0.01" />
                    </div>
                    <div>
                      <label>Qty</label>
                      <input type="number" className="form-input" placeholder="1" value={quickQty} onChange={(e) => setQuickQty(parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <label>Total</label>
                      <div className="form-input" style={{ backgroundColor: '#F9FAFB', color: '#374151', fontWeight: '600', display: 'flex', alignItems: 'center', height: '38px', border: '1px solid #E5E7EB' }}>
                        {(parseFloat(quickPrice || 0) * (quickQty || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {category === 'new-bill' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <button
                      className="btn-primary"
                      onClick={handleAddQuickItem}
                      style={{ padding: '8px 16px', fontSize: '14px', height: '40px' }}
                    >
                      <Plus size={18} />
                      <span>Add Item</span>
                    </button>
                  </div>
                )}

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
                      <label>Phone</label>
                      <input type="tel" className="form-input" placeholder="Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                    </div>
                    <div className="customer-input-section" style={{ marginTop: '12px' }}>
                      <label>Email</label>
                      <input type="email" className="form-input" placeholder="Email (optional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                    </div>
                  </>
                )}



                <div className="invoice-mode-selector" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIncludeGST(true)}
                    className={`mode-btn ${includeGST ? 'active' : ''}`}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB',
                      backgroundColor: includeGST ? '#EEF2FF' : '#fff',
                      color: includeGST ? '#4F46E5' : '#6B7280',
                      borderColor: includeGST ? '#4F46E5' : '#E5E7EB',
                      fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    GST Bill
                  </button>
                  <button
                    onClick={() => setIncludeGST(false)}
                    className={`mode-btn ${!includeGST ? 'active' : ''}`}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB',
                      backgroundColor: !includeGST ? '#F0FDF4' : '#fff',
                      color: !includeGST ? '#16A34A' : '#6B7280',
                      borderColor: !includeGST ? '#16A34A' : '#E5E7EB',
                      fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    Non-GST Bill
                  </button>
                </div>

                {includeGST && (
                  <div className="gst-specific-fields" style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#374151' }}>Dispatch & GST Info</h4>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Buyer's GSTIN</label>
                      <input type="text" className="form-input" placeholder="Optional" value={buyerGSTIN} onChange={(e) => setBuyerGSTIN(e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Through</label>
                        <input type="text" className="form-input" placeholder="e.g. Courier" value={despatchDetails.through} onChange={(e) => setDespatchDetails({ ...despatchDetails, through: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Artics</label>
                        <input type="number" className="form-input" placeholder="No. of items" value={despatchDetails.artics} onChange={(e) => setDespatchDetails({ ...despatchDetails, artics: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="selected-items-list">
                  {selectedItems.length === 0 ? (
                    <div className="empty-state"><p>No items added yet</p></div>
                  ) : (
                    selectedItems.map(item => (
                      <div key={item.id} className="order-item">
                        <div className="item-details">
                          <h4>{item.title}</h4>
                          <p>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
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
                  <div className="row"><span>Subtotal</span><span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {calculateSubtotal().toFixed(2)}</span></div>
                  <div className="row"><span>Tax</span><span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {calculateTax(Math.max(0, calculateSubtotal() - discount)).toFixed(2)}</span></div>
                  <div className="row">
                    <span>Discount</span>
                    <input type="number" className="discount-input" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: '80px', textAlign: 'right' }} />
                  </div>
                  <div className="total-row"><span>Total</span><span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {calculateTotal().toFixed(2)}</span></div>

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
                      <span>{calculateBalance() > 0 ? 'Balance Due' : 'Change'}</span>
                      <span>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {Math.abs(calculateBalance()).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="action-buttons">
                  <button className="btn-secondary" onClick={resetForm}>Cancel</button>
                  {editingOrderId && (
                    <button
                      className="btn-outline"
                      style={{ borderColor: '#EF4444', color: '#EF4444' }}
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this order?")) {
                          await deleteOrder(editingOrderId);
                          navigate('/orders');
                        }
                      }}
                    >
                      <Trash2 size={18} />
                      <span>Delete Order</span>
                    </button>
                  )}
                  <button className="btn-primary" onClick={handleSaveOrder}>
                    <Save size={18} />
                    <span>{editingOrderId ? 'Update' : 'Confirm Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {showInvoice && invoiceOrder && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div className="modal-content" style={{ position: 'relative', backgroundColor: 'white', padding: 0, borderRadius: '12px', width: '850px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <button
                  onClick={() => setShowInvoice(false)}
                  style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    zIndex: 1100,
                    fontSize: '32px',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: '#374151',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s',
                    lineHeight: 0,
                    paddingBottom: '5px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#E5E7EB'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                >
                  &times;
                </button>
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, borderRadius: '12px' }}>
                  {includeGST ? (
                    <GstInvoice
                      order={invoiceOrder}
                      settings={settings}
                      currentSubcategory={null}
                      title={title}
                    />
                  ) : (
                    <NonGstInvoice
                      order={invoiceOrder}
                      settings={settings}
                      currentSubcategory={null}
                      title={title}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button className="btn-primary" onClick={() => {
                      const element = document.getElementById('invoice-content');
                      const opt = includeGST ? {
                        margin: 5,
                        filename: `Invoice_${invoiceOrder.id}.pdf`,
                        image: { type: 'jpeg', quality: 1 },
                        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                      } : {
                        margin: 5,
                        filename: `Invoice_${invoiceOrder.id}.pdf`,
                        image: { type: 'jpeg', quality: 1 },
                        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
                      };
                      html2pdf().set(opt).from(element).save();
                    }}>Download PDF</button>
                    <button className="btn-outline" onClick={() => {
                      const msg = `Invoice ${invoiceOrder.id}\nCustomer: ${invoiceOrder.customer}\nTotal: ${(invoiceOrder.amount || 0).toFixed(2)} ${settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency}`;
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

export default OrderCategory;

