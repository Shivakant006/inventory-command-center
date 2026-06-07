import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity_in_stock: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000); // Auto-clear alerts
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (parseFloat(formData.price) < 0 || parseInt(formData.quantity_in_stock) < 0) {
      showAlert('error', 'Price and Quantity in Stock cannot be negative amounts.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingId) {
        // Handle API Update (PUT)
        await api.updateProduct(editingId, formData);
        showAlert('success', 'Product updated successfully!');
        setEditingId(null);
      } else {
        // Handle API Creation (POST)
        await api.createProduct(formData);
        showAlert('success', 'Product created successfully!');
      }
      setFormData({ name: '', sku: '', price: '', quantity_in_stock: '' });
      loadProducts(); // Refresh inventory list
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity_in_stock: product.quantity_in_stock
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you certain you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      showAlert('success', 'Product deleted from inventory.');
      loadProducts();
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  return (
    <div className="products-manager">
      <h2>Inventory & Product Management</h2>

      {/* Global Toast Notification Banner */}
      {message.text && (
        <div className={`alert-banner ${message.type}`}>
          {message.type === 'error' ? '⚠️' : '✅'} {message.text}
        </div>
      )}

      {/* Dynamic Action Form */}
      <div className="form-container">
        <h3>{editingId ? '⚡ Edit Product Details' : '➕ Add New Product'}</h3>
        <form onSubmit={handleSubmit} className="product-form">
          <input 
            type="text" name="name" placeholder="Product Name" 
            value={formData.name} onChange={handleInputChange} required 
          />
          <input 
            type="text" name="sku" placeholder="SKU/Barcode (Must be Unique)" 
            value={formData.sku} onChange={handleInputChange} required 
            disabled={!!editingId} // Unique identifier keys are typically immutable
          />
          <input 
            type="number" name="price" placeholder="Price ($)" step="0.01"
            value={formData.price} onChange={handleInputChange} required 
          />
          <input 
            type="number" name="quantity_in_stock" placeholder="Initial Inventory Stock" 
            value={formData.quantity_in_stock} onChange={handleInputChange} required 
          />
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {editingId ? 'Update Specifications' : 'Insert to Stock'}
            </button>
            {editingId && (
              <button type="button" className="cancel-btn" onClick={() => {
                setEditingId(null);
                setFormData({ name: '', sku: '', price: '', quantity_in_stock: '' });
              }}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* Live Inventory Overview Table */}
      <div className="table-container">
        <h3>Stock Inventory Records</h3>
        {products.length === 0 ? (
          <p>No products available. Add items above to seed your database.</p>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Name</th>
                <th>Price</th>
                <th>In Stock</th>
                <th>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={product.quantity_in_stock < 5 ? 'low-stock-row' : ''}>
                  <td><code>{product.sku}</code></td>
                  <td>{product.name}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td>
                    {product.quantity_in_stock} units 
                    {product.quantity_in_stock < 5 && <span className="badge">Low Stock</span>}
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditInit(product)}>Modify</button>
                    <button className="delete-btn" onClick={() => handleDelete(product.id)}>Remove</button>
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

export default Products;