import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useData } from '../context/DataContext';
import {
    Search,
    Plus,
    Bell,
    UserCircle,
    ChevronLeft,
    X,
    Edit,
    Trash2,
    FolderPlus,
    ArrowLeft
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const SubcategoryList = () => {
    const { typeId } = useParams();
    const navigate = useNavigate();
    const { cardTypes, getSubcategories, addSubcategory, updateSubcategory, deleteSubcategory } = useData();

    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSubName, setNewSubName] = useState('');
    const [newSubDesc, setNewSubDesc] = useState('');

    // Edit Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [editSubName, setEditSubName] = useState('');
    const [editSubDesc, setEditSubDesc] = useState('');

    const cardType = cardTypes.find(ct => ct.id === parseInt(typeId));

    useEffect(() => {
        loadSubcategories();
    }, [typeId]);

    const loadSubcategories = async () => {
        setLoading(true);
        const data = await getSubcategories(typeId);
        setSubcategories(data);
        setLoading(false);
    };

    const handleAddSubcategory = async () => {
        if (!newSubName.trim()) return;
        try {
            await addSubcategory(typeId, { name: newSubName.trim(), description: newSubDesc.trim() || null });
            setNewSubName('');
            setNewSubDesc('');
            setShowAddModal(false);
            loadSubcategories();
        } catch (error) {
            alert('Error creating subcategory: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleEditSubcategory = async () => {
        if (!editSubName.trim() || !editingSub) return;
        try {
            await updateSubcategory(typeId, editingSub.id, { name: editSubName.trim(), description: editSubDesc.trim() || null });
            setShowEditModal(false);
            setEditingSub(null);
            loadSubcategories();
        } catch (error) {
            alert('Error updating subcategory: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleDeleteSubcategory = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"? All products inside will be unlinked.`)) return;
        try {
            await deleteSubcategory(typeId, id);
            loadSubcategories();
        } catch (error) {
            alert('Error deleting subcategory: ' + (error?.message || 'Unknown error'));
        }
    };

    const openEditSub = (sub) => {
        setEditingSub(sub);
        setEditSubName(sub.name);
        setEditSubDesc(sub.description || '');
        setShowEditModal(true);
    };

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">
                <header className="top-bar">
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input type="text" placeholder="Search subcategories..." className="search-input" />
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
                                onClick={() => navigate('/inventory')}
                                style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="page-title">{cardType?.name || 'Card Type'}</h1>
                                <p className="page-subtitle">Manage subcategories inside this card type.</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                                <FolderPlus size={20} />
                                <span>Add Subcategory</span>
                            </button>
                        </div>
                    </div>

                    {/* Subcategories Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '24px' }}>
                            {subcategories.map(sub => (
                                <div key={sub.id} className="card" style={{
                                    padding: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '12px',
                                    position: 'relative'
                                }}
                                    onClick={() => navigate(`/inventory/type/${typeId}/sub/${sub.id}`)}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>{sub.name}</h3>
                                            {sub.description && <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>{sub.description}</p>}
                                            <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: '500' }}>
                                                {sub.inventory_items_count || 0} products
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
                                                onClick={() => openEditSub(sub)}
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                                                onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {subcategories.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                                    <FolderPlus size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No subcategories yet</p>
                                    <p style={{ fontSize: '14px' }}>Click "Add Subcategory" to create folders for your products.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Add Subcategory Modal */}
            {showAddModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add Subcategory</h2>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Subcategory Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newSubName}
                                onChange={(e) => setNewSubName(e.target.value)}
                                placeholder="e.g. Wedding, Engagement, Birthday"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newSubDesc}
                                onChange={(e) => setNewSubDesc(e.target.value)}
                                placeholder="e.g. Wedding invitation cards"
                            />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddSubcategory}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Subcategory Modal */}
            {showEditModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Edit Subcategory</h2>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowEditModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Subcategory Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editSubName}
                                onChange={(e) => setEditSubName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editSubDesc}
                                onChange={(e) => setEditSubDesc(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleEditSubcategory}>Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcategoryList;
