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
    Package
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const ProductList = () => {
    const { typeId, subId } = useParams();
    const navigate = useNavigate();
    const { inventory, cardTypes, getSubcategories, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();

    const [subcategory, setSubcategory] = useState(null);
    const [loading, setLoading] = useState(true);

    // Add Product Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', stock: 0, price: 0, image: '' });
    const [imagePreview, setImagePreview] = useState('');

    // Edit Product Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState('');

    const cardType = cardTypes.find(ct => ct.id === parseInt(typeId));

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
    const products = inventory.filter(item => item.subcategory_id === parseInt(subId));

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

    const handleAddProduct = async () => {
        if (!newItem.title) return;
        try {
            await addInventoryItem({
                item_name: newItem.title,
                category: cardType?.name || 'Uncategorized',
                subcategory_id: parseInt(subId),
                stock_quantity: parseInt(newItem.stock),
                cost_per_unit: parseFloat(newItem.price),
                low_stock_threshold: 20
            });
            setNewItem({ title: '', stock: 0, price: 0, image: '' });
            setImagePreview('');
            setShowAddModal(false);
        } catch (error) {
            alert('Error adding product: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleUpdateProduct = async () => {
        if (!editingItem?.title) return;
        try {
            await updateInventoryItem(editingItem.id, {
                item_name: editingItem.title,
                category: cardType?.name || 'Uncategorized',
                subcategory_id: parseInt(subId),
                stock_quantity: parseInt(editingItem.stock),
                cost_per_unit: parseFloat(editingItem.price),
                low_stock_threshold: 20
            });
            setShowEditModal(false);
            setEditingItem(null);
            setEditImagePreview('');
        } catch (error) {
            alert('Error updating product: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleDeleteProduct = async (id, title) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
        try {
            await deleteInventoryItem(id);
        } catch (error) {
            alert('Error deleting product: ' + (error?.message || 'Unknown error'));
        }
    };

    const openEditProduct = (item) => {
        setEditingItem({ ...item });
        setEditImagePreview(item.image || '');
        setShowEditModal(true);
    };

    const getStatusColor = (status) => {
        if (status === 'In Stock') return '#10B981';
        if (status === 'Low Stock') return '#F59E0B';
        return '#EF4444';
    };

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">
                <header className="top-bar">
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input type="text" placeholder="Search products..." className="search-input" />
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
                                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>{cardType?.name || 'Card Type'} →</p>
                                <h1 className="page-title">{subcategory?.name || 'Products'}</h1>
                                <p className="page-subtitle">Manage products in this subcategory.</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
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
                            {products.map(item => (
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
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>{item.title}</h3>
                                            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Stock: <strong>{item.stock}</strong></p>
                                            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Price: <strong>₹{item.price}</strong></p>
                                            <span style={{
                                                fontSize: '12px',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                backgroundColor: getStatusColor(item.status) + '20',
                                                color: getStatusColor(item.status),
                                                fontWeight: '600'
                                            }}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
                                                onClick={() => openEditProduct(item)}
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                                                onClick={() => handleDeleteProduct(item.id, item.title)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

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

            {/* Add Product Modal */}
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
                                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>PNG, JPG up to 5MB</p>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Product Name *</label>
                            <input type="text" className="form-input" value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                placeholder="e.g. Gold Foil Wedding Invite" />
                        </div>
                        <div className="form-group">
                            <label>Initial Stock</label>
                            <input type="number" className="form-input" value={newItem.stock}
                                onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Price per Unit</label>
                            <input type="number" className="form-input" value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} step="0.01" />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddProduct}>Add Product</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
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

                        <div className="form-group">
                            <label>Product Name *</label>
                            <input type="text" className="form-input" value={editingItem.title}
                                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Current Stock</label>
                            <input type="number" className="form-input" value={editingItem.stock}
                                onChange={(e) => setEditingItem({ ...editingItem, stock: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Price per Unit</label>
                            <input type="number" className="form-input" value={editingItem.price}
                                onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })} step="0.01" />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleUpdateProduct}>Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
