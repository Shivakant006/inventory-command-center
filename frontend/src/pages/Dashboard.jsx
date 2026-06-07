import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    lowStockItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel for optimal production performance
        const [products, customers, orders] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getOrders()
        ]);

        // Filter low stock items based on business rule (e.g., quantity < 5)
        const lowStock = products.filter(p => p.quantity_in_stock < 5);

        setMetrics({
          totalProducts: products.length,
          totalCustomers: customers.length,
          totalOrders: orders.length,
          lowStockItems: lowStock
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to aggregate dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="loading">Loading business metrics...</div>;
  if (error) return <div className="error-banner">⚠️ Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <h2>System Overview</h2>
      
      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Products</h3>
          <p className="metric-number">{metrics.totalProducts}</p>
        </div>
        <div className="metric-card">
          <h3>Active Customers</h3>
          <p className="metric-number">{metrics.totalCustomers}</p>
        </div>
        <div className="metric-card">
          <h3>Orders Processed</h3>
          <p className="metric-number">{metrics.totalOrders}</p>
        </div>
        <div className="metric-card warning">
          <h3>Low Stock Alerts</h3>
          <p className="metric-number">{metrics.lowStockItems.length}</p>
        </div>
      </div>

      {/* Actionable Low Stock Monitor */}
      <div className="inventory-warning-section">
        <h3>Critical Inventory Watchlist (&lt; 5 units)</h3>
        {metrics.lowStockItems.length === 0 ? (
          <p className="success-text">✅ All product inventory levels are healthy.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock Remaining</th>
              </tr>
            </thead>
            <tbody>
              {metrics.lowStockItems.map(item => (
                <tr key={item.id} className="critical-row">
                  <td>{item.name}</td>
                  <td><code>{item.sku}</code></td>
                  <td><strong>{item.quantity_in_stock} units</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;