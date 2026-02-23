import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useData } from '../context/DataContext';
import {
    Search,
    Plus,
    Bell,
    UserCircle,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    X,
    Upload,
    Image as ImageIcon,
    Edit,
    PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Inventory = () => {
    const navigate = useNavigate();
    const { addInventoryItem, updateInventoryItem } = useData();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', category: 'Invitation Cards', customCategory: '', stock: 0, price: 0, image: '' });
    const [imagePreview, setImagePreview] = useState('');

    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState('');
    const [customEditCategory, setCustomEditCategory] = useState('');

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

    const handleAddItem = async () => {
        if (!newItem.title) return;

        try {
            const finalCategory = newItem.category === 'Custom Card' ? newItem.customCategory : newItem.category;
            await addInventoryItem({
                item_name: newItem.title,
                category: finalCategory || 'Custom Card',
                stock_quantity: parseInt(newItem.stock),
                cost_per_unit: parseFloat(newItem.price),
                low_stock_threshold: 20 // Default or add a field
            });

            setNewItem({ title: '', category: 'Invitation Cards', customCategory: '', stock: 0, price: 0, image: '' });
            setImagePreview('');
            setShowAddModal(false);
        } catch (error) {
            alert('Error adding item: ' + (error.message || 'Unknown error'));
        }
    };

    const handleUpdateItem = async () => {
        if (!editingItem.title) return;

        try {
            const finalCategory = editingItem.category === 'Custom Card' ? customEditCategory : editingItem.category;
            await updateInventoryItem(editingItem.id, {
                item_name: editingItem.title,
                category: finalCategory || 'Custom Card',
                stock_quantity: parseInt(editingItem.stock),
                cost_per_unit: parseFloat(editingItem.price),
                low_stock_threshold: 20
            });
            setShowEditModal(false);
            setEditingItem(null);
            setEditImagePreview('');
            setCustomEditCategory('');
        } catch (error) {
            alert('Error updating item: ' + (error.message || 'Unknown error'));
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">
                <header className="top-bar">
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input type="text" placeholder="Search card types..." className="search-input" />
                    </div>
                    <div className="top-actions">
                        <button className="icon-btn">
                            <Bell size={20} />
                        </button>
                        <button className="icon-btn">
                            <UserCircle size={24} />
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Stock & Inventory</h1>
                            <p className="page-subtitle">Manage your card types and stock levels.</p>
                        </div>
                        <div className="header-actions">
                            <div className="search-wrapper-large">
                                <Search className="search-icon" size={18} />
                                <input type="text" placeholder="Search card types..." />
                            </div>
                            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                                <Plus size={20} />
                                <span>Add Product</span>
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="order-selection-row">
                            <button className="action-btn" onClick={() => navigate('/inventory/invitation-cards')}>
                                <span>Invitation Cards</span>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/inventory/visiting-cards')}>
                                <span>Visiting Cards</span>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/inventory/bill-books')}>
                                <span>Bill Books</span>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/inventory/custom-cards')}>
                                <span>Custom Cards</span>
                            </button>
                        </div>
                    </div>
                </div>



                <div className="pagination">
                    <button className="icon-btn-outline small">
                        <ChevronLeft size={16} />
                    </button>
                    <button className="page-btn active">1</button>
                    <button className="page-btn">2</button>
                    <button className="page-btn">3</button>
                    <span className="page-ellipsis">...</span>
                    <button className="icon-btn-outline small">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </main>

            {showAddModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '450px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Add New Card Type</h3>
                            <button onClick={() => {
                                setShowAddModal(false);
                                setImagePreview('');
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Image Upload Section */}
                        <div className="form-group">
                            <label>Product Image</label>
                            <div style={{
                                border: '2px dashed #E5E7EB',
                                borderRadius: '8px',
                                padding: '20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: imagePreview ? '#fff' : '#F9FAFB',
                                marginBottom: '12px'
                            }}>
                                {imagePreview ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={imagePreview} alt="Preview" style={{
                                            maxWidth: '100%',
                                            maxHeight: '200px',
                                            borderRadius: '8px'
                                        }} />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setImagePreview('');
                                                setNewItem({ ...newItem, image: '' });
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                                        <ImageIcon size={48} style={{ margin: '0 auto 12px', color: '#9CA3AF' }} />
                                        <p style={{ color: '#6B7280', marginBottom: '4px' }}>Click to upload image</p>
                                        <p style={{ color: '#9CA3AF', fontSize: '12px' }}>PNG, JPG up to 5MB</p>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Card Title *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                placeholder="e.g. Gold Foil Wedding Invite"
                            />
                        </div>
                        <div className="form-group">
                            <label>Card Type *</label>
                            <select
                                className="form-input"
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            >
                                <option value="Invitation Cards">Invitation Cards</option>
                                <option value="Visiting Cards">Visiting Cards</option>
                                <option value="Bill Books">Bill Books</option>
                                <option value="Custom Card">Custom Card</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Initial Stock</label>
                            <input
                                type="number"
                                className="form-input"
                                value={newItem.stock}
                                onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Price per Unit</label>
                            <input
                                type="number"
                                className="form-input"
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                step="0.01"
                            />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => {
                                setShowAddModal(false);
                                setImagePreview('');
                            }}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddItem}>Add Item</button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Edit Item Modal */}
            {
                showEditModal && editingItem && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div className="modal-content" style={{
                            backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '450px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto'
                        }}>
                            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Edit Card Type</h3>
                                <button onClick={() => {
                                    setShowEditModal(false);
                                    setEditingItem(null);
                                }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Edit Image Upload Section */}
                            <div className="form-group">
                                <label>Product Image</label>
                                <div style={{
                                    border: '2px dashed #E5E7EB',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: editImagePreview ? '#fff' : '#F9FAFB',
                                    marginBottom: '12px'
                                }}>
                                    {editImagePreview ? (
                                        <div style={{ position: 'relative' }}>
                                            <img src={editImagePreview} alt="Preview" style={{
                                                maxWidth: '100%',
                                                maxHeight: '200px',
                                                borderRadius: '8px'
                                            }} />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditImagePreview('');
                                                    setEditingItem({ ...editingItem, image: '' });
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    background: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="edit-image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                                            <ImageIcon size={48} style={{ margin: '0 auto 12px', color: '#9CA3AF' }} />
                                            <p style={{ color: '#6B7280', marginBottom: '4px' }}>Click to upload image</p>
                                            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>PNG, JPG up to 5MB</p>
                                            <input
                                                id="edit-image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, true)}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Card Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingItem.title}
                                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Card Type *</label>
                                <select
                                    className="form-input"
                                    value={editingItem.category}
                                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                >
                                    <option value="Invitation Cards">Invitation Cards</option>
                                    <option value="Visiting Cards">Visiting Cards</option>
                                    <option value="Bill Books">Bill Books</option>
                                    <option value="Custom Card">Custom Card</option>
                                </select>
                            </div>
                            {editingItem.category === 'Custom Card' && (
                                <div className="form-group" style={{ marginTop: '-12px', paddingLeft: '8px' }}>
                                    <label style={{ fontSize: '14px', color: '#4B5563' }}>Specify Card Type Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={customEditCategory}
                                        onChange={(e) => setCustomEditCategory(e.target.value)}
                                        placeholder="e.g. Posters, Calendars"
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Current Stock</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editingItem.stock}
                                    onChange={(e) => setEditingItem({ ...editingItem, stock: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Price per Unit</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editingItem.price}
                                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                                    step="0.01"
                                />
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button className="btn-secondary" onClick={() => {
                                    setShowEditModal(false);
                                    setEditingItem(null);
                                }}>Cancel</button>
                                <button className="btn-primary" onClick={handleUpdateItem}>Update Item</button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Inventory;
