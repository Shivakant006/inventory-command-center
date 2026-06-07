import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ customer_id: '', product_id: '', quantity: 1 });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrderData();
  }, []);

  const loadOrderData = async () => {
    try {
      const [ordersData, productsData, customersData] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers()
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (err) {
      showAlert('error', 'Failed to synchronize order logs.');
    }
  };

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseInt(value) || value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.quantity <= 0) {
      showAlert('error', 'Ordered quantity must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      // Sends payload to backend logic for automated stock validation & calculation
      await api.createOrder({
        customer_id: Number(formData.customer_id),
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity)
      });
      
      showAlert('success', 'Order processed and stock levels updated successfully!');
      setFormData({ customer_id: '', product_id: '', quantity: 1 });
      await loadOrderData(); // Reload orders and newly adjusted product stock amounts
    } catch (err) {
      // Handles 'Insufficient inventory' or missing record exceptions explicitly 
      showAlert('error', err.message || 'Transaction rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this order? (Note: Stock levels will need manual adjustment)')) return;
    try {
      await api.deleteOrder(id);
      showAlert('success', 'Order record removed.');
      loadOrderData();
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Helper lookups to display readable names instead of raw IDs in the list
  const getCustomerName = (id) => customers.find(c => c.id === id)?.name || `ID #${id}`;
  const getProductName = (id) => products.find(p => p.id === id)?.name || `ID #${id}`;

  return (
    <div className="orders-ledger">
      <h2>Sales & Order Fulfillment Ledger</h2>

      {message.text && (
        <div className={`alert-banner ${message.type}`}>
          {message.type === 'error' ? '⚠️' : '✅'} {message.text}
        </div>
      )}

      {/* Checkout Engine Form */}
      <div className="form-container">
        <h3>🛒 Generate New Customer Order</h3>
        <form onSubmit={handleSubmit} className="order-form">
          <select 
            name="customer_id" 
            value={formData.customer_id} 
            onChange={handleInputChange} 
            required
          >
            <option value="">Select Purchasing Client...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>

          <select 
            name="product_id" 
            value={formData.product_id} 
            onChange={handleInputChange} 
            required
          >
            <option value="">Select Product from Inventory...</option>
            {products.map(p => (
              <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                {p.name} — ${Number(p.price).toFixed(2)} ({p.quantity_in_stock} available)
              </option>
            ))}
          </select>

          <input 
            type="number" 
            name="quantity" 
            placeholder="Units Ordered" 
            min="1"
            value={formData.quantity} 
            onChange={handleInputChange} 
            required 
          />

          <button type="submit" disabled={loading || customers.length === 0 || products.length === 0}>
            {loading ? 'Validating & Processing...' : 'Authorize Checkout & Deduct Stock'}
          </button>
        </form>
      </div>

      {/* Historic Transaction Logs Table */}
      <div className="table-container">
        <h3>Processed Order Ledger</h3>
        {orders.length === 0 ? (
          <p>No orders have been generated yet. Complete the form above to trigger checkout execution.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Log</th>
                <th>Client</th>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Invoice Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><code>ORD-{order.id.toString().padStart(4, '0')}</code></td>
                  <td>{getCustomerName(order.customer_id)}</td>
                  <td>{getProductName(order.product_id)}</td>
                  <td>{order.quantity} units</td>
                  <td><strong>${Number(order.total_amount).toFixed(2)}</strong></td>
                  <td>
                    <button className="delete-btn text" onClick={() => handleCancelOrder(order.id)}>Cancel Order</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Orders;