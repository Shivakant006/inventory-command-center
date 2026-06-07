import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import './App.css'; // Add your custom dashboard grid/card styles here

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo">IMS Admin</div>
        <nav>
          <button 
            className={currentView === 'dashboard' ? 'active' : ''} 
            onClick={() => setCurrentView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={currentView === 'products' ? 'active' : ''} 
            onClick={() => setCurrentView('products')}
          >
            📦 Products
          </button>
          <button 
            className={currentView === 'customers' ? 'active' : ''} 
            onClick={() => setCurrentView('customers')}
          >
            👥 Customers
          </button>
          <button 
            className={currentView === 'orders' ? 'active' : ''} 
            onClick={() => setCurrentView('orders')}
          >
            🛒 Orders
          </button>
        </nav>
      </aside>

      {/* Main Workspace Layout */}
      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'products' && <Products />} {/* ⚡ Replace the plain placeholder text */}
        {currentView === 'customers' && <Customers />} {/* ⚡ Replace your old placeholder block */}
        {currentView === 'orders' && <Orders />} {/* ⚡ Replace your last placeholder view block */}
      </main>
    </div>
  );
}

export default App;