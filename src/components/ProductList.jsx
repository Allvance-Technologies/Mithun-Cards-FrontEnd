import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useData } from '../context/DataContext';
import {
    Search,
    Plus,
    Bell,
    UserCircle,
    X,
    Upload,
    Image as ImageIcon,
    Edit,
    Trash2,
    ArrowLeft,
    Package,
    AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const ProductList = () => {
    const { typeId, subId } = useParams();
    const navigate = useNavigate();
    const { inventory, cardTypes, getSubcategories, addInventoryItem, updateInventoryItem, deleteInventoryItem, settings } = useData();

    const [subcategory, setSubcategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Add Product Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', stock: '', price: '', image: '' });
    const [imagePreview, setImagePreview] = useState('');
    const [addErrors, setAddErrors] = useState({});
    const [addSubmitting, setAddSubmitting] = useState(false);

    // Edit Product Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState('');
    const [editErrors, setEditErrors] = useState({});
    const [editSubmitting, setEditSubmitting] = useState(false);

    const cardType = cardTypes.find(ct => ct.id === parseInt(typeId));
    const currencySymbol = settings?.currency === 'INR' ? '₹' : settings?.currency === 'USD' ? '$' : (settings?.currency || '₹');

    useEffect(() => {
        loadSubcategory();
    }, [typeId, subId]);

    const loadSubcategory = async () => {
        setLoading(true);
        const subs = await getSubcategories(typeId);
        const found = subs.find(s => s.id === parseInt(subId));
        setSubcategory(found);
        setLoading(false);
    };

    // Filter inventory items that belong to this subcategory
    const products = inventory
        .filter(item => item.subcategory_id === parseInt(subId))
        .filter(item => !searchQuery || (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const handleImageUpload = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isEdit) {
                    setEditImagePreview(reader.result);
                    setEditingItem({ ...editingItem, image: reader.result });
                } else {
                    setImagePreview(reader.result);
                    setNewItem({ ...newItem, image: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // ── Validation ──
    const validateAdd = () => {
        const errors = {};
        if (!(newItem.title || '').trim()) errors.title = 'Product name is required';
        if (newItem.stock === '' || newItem.stock === undefined) errors.stock = 'Stock quantity is required';
        else if (parseInt(newItem.stock) < 0) errors.stock = 'Stock cannot be negative';
        if (newItem.price === '' || newItem.price === undefined) errors.price = 'Price is required';
        else if (parseFloat(newItem.price) < 0) errors.price = 'Price cannot be negative';
        setAddErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEdit = () => {
        const errors = {};
        if (!(editingItem?.title || '').trim()) errors.title = 'Product name is required';
        if (editingItem?.stock === '' || editingItem?.stock === undefined) errors.stock = 'Stock quantity is required';
        else if (parseInt(editingItem.stock) < 0) errors.stock = 'Stock cannot be negative';
        if (editingItem?.price === '' || editingItem?.price === undefined) errors.price = 'Price is required';
        else if (parseFloat(editingItem.price) < 0) errors.price = 'Price cannot be negative';
        setEditErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ── Add Product ──
    const handleAddProduct = async () => {
        if (!validateAdd()) return;
        setAddSubmitting(true);
        try {
            await addInventoryItem({
                item_name: newItem.title.trim(),
                category: cardType?.name || 'Uncategorized',
                subcategory_id: parseInt(subId),
                stock_quantity: parseInt(newItem.stock) || 0,
                cost_per_unit: parseFloat(newItem.price) || 0,
                low_stock_threshold: 20
            });
            setNewItem({ title: '', stock: '', price: '', image: '' });
            setImagePreview('');
            setAddErrors({});
            setShowAddModal(false);
        } catch (error) {
            alert('Error adding product: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
        }
        setAddSubmitting(false);
    };

    // ── Update Product ──
    const handleUpdateProduct = async () => {
        if (!validateEdit()) return;
        setEditSubmitting(true);
        try {
            await updateInventoryItem(editingItem.id, {
                item_name: editingItem.title.trim(),
                category: cardType?.name || 'Uncategorized',
                subcategory_id: parseInt(subId),
                stock_quantity: parseInt(editingItem.stock) || 0,
                cost_per_unit: parseFloat(editingItem.price) || 0,
                low_stock_threshold: 20
            });
            setShowEditModal(false);
            setEditingItem(null);
            setEditImagePreview('');
            setEditErrors({});
        } catch (error) {
            alert('Error updating product: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
        }
        setEditSubmitting(false);
    };

    const handleDeleteProduct = async (id, title) => {
        if (!confirm(`Are you sure you want to delete "${title || 'this product'}"?`)) return;
        try {
            await deleteInventoryItem(id);
        } catch (error) {
            alert('Error deleting product: ' + (error?.message || 'Unknown error'));
        }
    };

    const openEditProduct = (item) => {
        setEditingItem({ ...item });
        setEditImagePreview(item.image || '');
        setEditErrors({});
        setShowEditModal(true);
    };

    const getStatusColor = (status) => {
        if (status === 'In Stock') return '#10B981';
        if (status === 'Low Stock') return '#F59E0B';
        return '#EF4444';
    };

    const getStatusText = (item) => {
        if (item.stock === 0 || item.stock === '0') return 'Out of Stock';
        if (item.status) return item.status;
        return 'In Stock';
    };

    // ── Reusable Form Field ──
    const FormField = ({ label, required, error, children }) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            {children}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#EF4444', fontSize: '12px' }}>
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">
                <header className="top-bar">
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="top-actions">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <button className="icon-btn"><UserCircle size={24} /></button>
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="page-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={() => navigate(`/inventory/type/${typeId}`)}
                                style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>{cardType?.name || 'Product Type'} →</p>
                                <h1 className="page-title">{subcategory?.name || 'Products'}</h1>
                                <p className="page-subtitle">Manage products in this subcategory.</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={() => { setAddErrors({}); setNewItem({ title: '', stock: '', price: '', image: '' }); setImagePreview(''); setShowAddModal(true); }}>
                                <Plus size={20} />
                                <span>Add Product</span>
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
                            {products.map(item => {
                                const status = getStatusText(item);
                                return (
                                    <div key={item.id} className="card" style={{
                                        padding: '20px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '12px',
                                        transition: 'all 0.2s ease'
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        {item.image && (
                                            <img src={item.image} alt={item.title} style={{
                                                width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px'
                                            }} loading="lazy" />
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '8px', wordBreak: 'break-word' }}>
                                                    {item.title || <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>Untitled</span>}
                                                </h3>
                                                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                                                    Stock: <strong style={{ color: '#1F2937' }}>{item.stock ?? 0}</strong>
                                                </p>
                                                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                                                    Price: <strong style={{ color: '#1F2937' }}>{currencySymbol}{parseFloat(item.price || 0).toFixed(2)}</strong>
                                                </p>
                                                <span style={{
                                                    fontSize: '12px',
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    backgroundColor: getStatusColor(status) + '20',
                                                    color: getStatusColor(status),
                                                    fontWeight: '600'
                                                }}>
                                                    {status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                <button
                                                    style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', color: '#6B7280', padding: '6px', display: 'flex', alignItems: 'center' }}
                                                    onClick={() => openEditProduct(item)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer', color: '#EF4444', padding: '6px', display: 'flex', alignItems: 'center' }}
                                                    onClick={() => handleDeleteProduct(item.id, item.title)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {products.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                                    <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No products yet</p>
                                    <p style={{ fontSize: '14px' }}>Click "Add Product" to add cards to this subcategory.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* ──────── Add Product Modal ──────── */}
            {showAddModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '500px',
                        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add Product</h2>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Image Upload */}
                        <div style={{
                            border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '24px', textAlign: 'center',
                            marginBottom: '20px', cursor: 'pointer', position: 'relative'
                        }}>
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                            }} />
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" style={{ maxHeight: '120px', borderRadius: '8px' }} />
                            ) : (
                                <div>
                                    <ImageIcon size={36} style={{ color: '#9CA3AF', marginBottom: '8px' }} />
                                    <p style={{ color: '#3B82F6', fontWeight: '500' }}>Click to upload image</p>
                                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>PNG, JPG up to 5MB (optional)</p>
                                </div>
                            )}
                        </div>

                        <FormField label="Product Name" required error={addErrors.title}>
                            <input
                                type="text"
                                className="form-input"
                                value={newItem.title}
                                onChange={(e) => { setNewItem({ ...newItem, title: e.target.value }); if (addErrors.title) setAddErrors({ ...addErrors, title: '' }); }}
                                placeholder="e.g. Gold Foil Wedding Invite"
                                style={addErrors.title ? { borderColor: '#EF4444' } : {}}
                            />
                        </FormField>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <FormField label="Stock Quantity" required error={addErrors.stock}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.stock}
                                    onChange={(e) => { setNewItem({ ...newItem, stock: e.target.value }); if (addErrors.stock) setAddErrors({ ...addErrors, stock: '' }); }}
                                    placeholder="0"
                                    min="0"
                                    style={addErrors.stock ? { borderColor: '#EF4444' } : {}}
                                />
                            </FormField>
                            <FormField label={`Price (${currencySymbol})`} required error={addErrors.price}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.price}
                                    onChange={(e) => { setNewItem({ ...newItem, price: e.target.value }); if (addErrors.price) setAddErrors({ ...addErrors, price: '' }); }}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    style={addErrors.price ? { borderColor: '#EF4444' } : {}}
                                />
                            </FormField>
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddProduct} disabled={addSubmitting}>
                                {addSubmitting ? 'Adding...' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ──────── Edit Product Modal ──────── */}
            {showEditModal && editingItem && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '500px',
                        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Edit Product</h2>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowEditModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Edit Image Upload */}
                        <div style={{
                            border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '24px', textAlign: 'center',
                            marginBottom: '20px', cursor: 'pointer', position: 'relative'
                        }}>
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                            }} />
                            {editImagePreview ? (
                                <img src={editImagePreview} alt="Preview" style={{ maxHeight: '120px', borderRadius: '8px' }} />
                            ) : (
                                <div>
                                    <ImageIcon size={36} style={{ color: '#9CA3AF', marginBottom: '8px' }} />
                                    <p style={{ color: '#3B82F6', fontWeight: '500' }}>Click to upload or change image</p>
                                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>PNG, JPG up to 5MB (optional)</p>
                                </div>
                            )}
                        </div>

                        <FormField label="Product Name" required error={editErrors.title}>
                            <input
                                type="text"
                                className="form-input"
                                value={editingItem.title || ''}
                                onChange={(e) => { setEditingItem({ ...editingItem, title: e.target.value }); if (editErrors.title) setEditErrors({ ...editErrors, title: '' }); }}
                                placeholder="e.g. Gold Foil Wedding Invite"
                                style={editErrors.title ? { borderColor: '#EF4444' } : {}}
                            />
                        </FormField>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <FormField label="Stock Quantity" required error={editErrors.stock}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editingItem.stock ?? ''}
                                    onChange={(e) => { setEditingItem({ ...editingItem, stock: e.target.value }); if (editErrors.stock) setEditErrors({ ...editErrors, stock: '' }); }}
                                    placeholder="0"
                                    min="0"
                                    style={editErrors.stock ? { borderColor: '#EF4444' } : {}}
                                />
                            </FormField>
                            <FormField label={`Price (${currencySymbol})`} required error={editErrors.price}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editingItem.price ?? ''}
                                    onChange={(e) => { setEditingItem({ ...editingItem, price: e.target.value }); if (editErrors.price) setEditErrors({ ...editErrors, price: '' }); }}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    style={editErrors.price ? { borderColor: '#EF4444' } : {}}
                                />
                            </FormField>
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleUpdateProduct} disabled={editSubmitting}>
                                {editSubmitting ? 'Updating...' : 'Update Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
