import React from 'react';
import Sidebar from './Sidebar';
import { FolderOpen, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const NewOrder = () => {
  const navigate = useNavigate();
  const { cardTypes } = useData();

  // Color palette for card type icons
  const iconColors = ['blue', 'indigo', 'purple', 'pink', 'green', 'orange', 'teal', 'red'];

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-content">
          <div className="page-header-actions">
            <h1 className="page-title">New Order</h1>
          </div>
          <div className="card">
            <div className="actions-grid">
              {/* Dynamic Card Type Buttons from API */}
              {cardTypes.map((ct, index) => (
                <button key={ct.id} className="action-btn" onClick={() => navigate(`/orders/new/type/${ct.id}`)}>
                  <div className={`action-icon ${iconColors[index % iconColors.length]}`}><FolderOpen size={20} /></div>
                  <span>{ct.name}</span>
                </button>
              ))}

              {/* New Bill - always available */}
              <button className="action-btn" onClick={() => navigate('/orders/new/new-bill')}>
                <div className="action-icon green"><Receipt size={20} /></div>
                <span>New Bill</span>
              </button>

              {cardTypes.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                  <FolderOpen size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>No product types created yet</p>
                  <p style={{ fontSize: '13px' }}>Go to Inventory → Add Product Type to create categories first.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewOrder;
