import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';
import NewOrder from './components/NewOrder';
import Orders from './components/Orders';
import OrderCategory from './components/OrderCategory';
import Expenditure from './components/Expenditure';
import ExpenditureType from './components/ExpenditureType';
import InventoryCategory from './components/InventoryCategory';
import SubcategoryList from './components/SubcategoryList';
import ProductList from './components/ProductList';
import Customers from './components/Customers';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const LoginWrapper = () => {
  const { currentUser } = useData();
  return currentUser ? <Navigate to="/dashboard" replace /> : (
    <div className="app-container">
      <LoginCard />
    </div>
  );
};

function App() {
  return (
    <DataProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginWrapper />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/new" element={<ProtectedRoute><NewOrder /></ProtectedRoute>} />
          <Route path="/orders/new/:category" element={<ProtectedRoute><OrderCategory /></ProtectedRoute>} />
          <Route path="/orders/new/:category/:subtype" element={<ProtectedRoute><OrderCategory /></ProtectedRoute>} />
          <Route path="/orders/edit/:category/:orderId" element={<ProtectedRoute><OrderCategory /></ProtectedRoute>} />
          <Route path="/expenditure" element={<ProtectedRoute><Expenditure /></ProtectedRoute>} />
          <Route path="/expenditure/:type" element={<ProtectedRoute><ExpenditureType /></ProtectedRoute>} />
          <Route path="/inventory/:category" element={<ProtectedRoute><InventoryCategory /></ProtectedRoute>} />
          <Route path="/inventory/:category/:subtype" element={<ProtectedRoute><InventoryCategory /></ProtectedRoute>} />
          <Route path="/inventory/type/:typeId" element={<ProtectedRoute><SubcategoryList /></ProtectedRoute>} />
          <Route path="/inventory/type/:typeId/sub/:subId" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </Router>
    </DataProvider>
  );
}

export default App;
