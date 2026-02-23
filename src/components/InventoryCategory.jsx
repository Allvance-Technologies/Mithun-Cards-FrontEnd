import React from 'react';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';

import { useData } from '../context/DataContext';

const names = {
  'invitation-cards': 'Invitation Cards',
  'visiting-cards': 'Visiting Cards',
  'bill-books': 'Bill Books',
  'custom-cards': 'Custom Card'
};



const InventoryCategory = () => {
  const { category, subtype } = useParams();
  const navigate = useNavigate();
  const title = names[category] || (category ? category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Category');
  const { inventory, settings } = useData();

  const filterBySubtype = (list) => {
    const categoryName = names[category];
    let filtered = list.filter(i => {
      if (categoryName) return i.category === categoryName;
      // Fallback for custom dynamic categories: match by slug
      return (i.category || '').toLowerCase().replace(/ /g, '-') === category;
    });

    if (!subtype) return filtered;

    const key = subtype.toLowerCase();
    if (key === 'wedding') return filtered.filter(i => (i.title || '').toLowerCase().includes('wedding'));
    if (key === 'engagement') return filtered.filter(i => (i.title || '').toLowerCase().includes('engagement'));
    if (key === 'baptism') return filtered.filter(i => (i.title || '').toLowerCase().includes('baptism'));
    if (key === 'holy-communion') return filtered.filter(i => (i.title || '').toLowerCase().includes('communion'));
    if (key === 'others') return filtered.filter(i => !(
      (i.title || '').toLowerCase().includes('wedding') ||
      (i.title || '').toLowerCase().includes('engagement') ||
      (i.title || '').toLowerCase().includes('baptism') ||
      (i.title || '').toLowerCase().includes('communion')
    ));
    return filtered;
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-content">
          <h1 className="page-title">{title}</h1>
          {category === 'invitation-cards' && !subtype ? (
            <div className="card">
              <div className="order-selection-row">
                <button className="action-btn" onClick={() => navigate('/inventory/invitation-cards/wedding')}><span>Wedding</span></button>
                <button className="action-btn" onClick={() => navigate('/inventory/invitation-cards/engagement')}><span>Engagement</span></button>
                <button className="action-btn" onClick={() => navigate('/inventory/invitation-cards/baptism')}><span>Baptism</span></button>
                <button className="action-btn" onClick={() => navigate('/inventory/invitation-cards/holy-communion')}><span>Holy Communion</span></button>
                <button className="action-btn" onClick={() => navigate('/inventory/invitation-cards/others')}><span>Others</span></button>
              </div>
            </div>
          ) : (
            <div className="inventory-grid">
              {filterBySubtype(inventory).map(item => (
                <div key={item.id} className="card inventory-card">
                  {item.image && (
                    <div className="inventory-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}
                  <div className="inventory-header">
                    <h3 className="inventory-title">{item.title}</h3>
                  </div>
                  <div className="inventory-stats">
                    <span className="stock-count">{item.stock}</span>
                    <span className="stock-label">Units in stock</span>
                  </div>
                  <div className="inventory-footer">
                    <span className="price-tag">{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : settings.currency} {parseFloat(item.price || 0).toFixed(2)}</span>
                    <div className="inventory-status">
                      {item.status === 'Low Stock' && (
                        <span className="status-dot warning">Low Stock</span>
                      )}
                      {item.status === 'Out of Stock' && (
                        <span className="status-dot danger">Out of Stock</span>
                      )}
                      {item.status === 'In Stock' && (
                        <span className="status-dot success">In Stock</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filterBySubtype(inventory).length === 0 && (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: '#6B7280' }}>No cards found for this category.</p>
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: '16px' }}>
            <button className="btn-secondary" onClick={() => navigate('/inventory')}>Back to Inventory</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryCategory;
