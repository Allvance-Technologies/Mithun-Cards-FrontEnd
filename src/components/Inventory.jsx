import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useData } from '../context/DataContext';
import {
    Search,
    Plus,
    Bell,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Upload,
    Image as ImageIcon,
    Edit,
    Trash2,
    FolderPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Inventory = () => {
    const navigate = useNavigate();
    const { inventory, cardTypes, addInventoryItem, updateInventoryItem, addCardType, deleteCardType, updateCardType } = useData();

    // Add Card Type Modal
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeDesc, setNewTypeDesc] = useState('');

    // Edit Card Type Modal
    const [showEditTypeModal, setShowEditTypeModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [editTypeName, setEditTypeName] = useState('');
    const [editTypeDesc, setEditTypeDesc] = useState('');

    const handleAddCardType = async () => {
        if (!newTypeName.trim()) return;
        try {
            await addCardType({ name: newTypeName.trim(), description: newTypeDesc.trim() || null });
            setNewTypeName('');
            setNewTypeDesc('');
            setShowAddTypeModal(false);
        } catch (error) {
            alert('Error creating card type: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleEditCardType = async () => {
        if (!editTypeName.trim() || !editingType) return;
        try {
            await updateCardType(editingType.id, { name: editTypeName.trim(), description: editTypeDesc.trim() || null });
            setShowEditTypeModal(false);
            setEditingType(null);
        } catch (error) {
            alert('Error updating card type: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleDeleteCardType = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"? All subcategories and products inside will also be removed.`)) return;
        try {
            await deleteCardType(id);
        } catch (error) {
            alert('Error deleting card type: ' + (error?.message || 'Unknown error'));
        }
    };

    const openEditType = (ct) => {
        setEditingType(ct);
        setEditTypeName(ct.name);
        setEditTypeDesc(ct.description || '');
        setShowEditTypeModal(true);
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
                            <p className="page-subtitle">Manage your card types, subcategories, and stock levels.</p>
                        </div>
                        <div className="header-actions">
                            <div className="search-wrapper-large">
                                <Search className="search-icon" size={18} />
                                <input type="text" placeholder="Search card types..." />
                            </div>
                            <button className="btn-primary" onClick={() => setShowAddTypeModal(true)}>
                                <FolderPlus size={20} />
                                <span>Add Card Type</span>
                            </button>
                        </div>
                    </div>

                    {/* Card Types Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '24px' }}>
                        {cardTypes.map(ct => (
                            <div key={ct.id} className="card" style={{
                                padding: '24px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                                position: 'relative'
                            }}
                                onClick={() => navigate(`/inventory/type/${ct.id}`)}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>{ct.name}</h3>
                                        {ct.description && <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>{ct.description}</p>}
                                        <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: '500' }}>
                                            {ct.subcategories_count || 0} subcategories
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                        <button
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
                                            onClick={() => openEditType(ct)}
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                                            onClick={() => handleDeleteCardType(ct.id, ct.name)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {cardTypes.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                                <FolderPlus size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No card types yet</p>
                                <p style={{ fontSize: '14px' }}>Click "Add Card Type" to create your first category.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add Card Type Modal */}
            {showAddTypeModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add Card Type</h2>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddTypeModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Card Type Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="e.g. Invitation Cards, Visiting Cards"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newTypeDesc}
                                onChange={(e) => setNewTypeDesc(e.target.value)}
                                placeholder="e.g. All types of invitation cards"
                            />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowAddTypeModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddCardType}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Card Type Modal */}
            {showEditTypeModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Edit Card Type</h2>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowEditTypeModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Card Type Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editTypeName}
                                onChange={(e) => setEditTypeName(e.target.value)}
                                placeholder="e.g. Invitation Cards"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editTypeDesc}
                                onChange={(e) => setEditTypeDesc(e.target.value)}
                                placeholder="e.g. All types of invitation cards"
                            />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowEditTypeModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleEditCardType}>Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
