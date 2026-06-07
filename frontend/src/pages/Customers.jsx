import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      showAlert('error', 'Please present a valid corporate email structure.');
      return;
    }

    setLoading(true);
    try {
      await api.createCustomer(formData);
      showAlert('success', 'New customer profile registered successfully.');
      setFormData({ name: '', email: '', phone: '' });
      loadCustomers(); // Pull fresh records
    } catch (err) {
      // Catches backend errors like unique email violations cleanly
      showAlert('error', err.message || 'Email already exists in records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this profile? Associated order logs will be cleared.')) return;
    try {
      await api.deleteCustomer(id);
      showAlert('success', 'Customer entry purged safely.');
      loadCustomers();
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  return (
    <div className="customers-directory">
      <h2>Client & Customer Directory</h2>

      {/* Global Alerts Banner */}
      {message.text && (
        <div className={`alert-banner ${message.type}`}>
          {message.type === 'error' ? '⚠️' : '✅'} {message.text}
        </div>
      )}

      {/* Add Client Section */}
      <div className="form-container">
        <h3>➕ Onboard New Customer</h3>
        <form onSubmit={handleSubmit} className="customer-form">
          <input 
            type="text" name="name" placeholder="Full Client Name" 
            value={formData.name} onChange={handleInputChange} required 
          />
          <input 
            type="email" name="email" placeholder="Email Address (Must be Unique)" 
            value={formData.email} onChange={handleInputChange} required 
          />
          <input 
            type="tel" name="phone" placeholder="Phone Number (e.g., +15550199)" 
            value={formData.phone} onChange={handleInputChange} required 
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Processing Registry...' : 'Register Corporate Client'}
          </button>
        </form>
      </div>

      {/* Current Records Grid View */}
      <div className="table-container">
        <h3>Active System Clients</h3>
        {customers.length === 0 ? (
          <p>The client registry is empty. Add a profile above to get started.</p>
        ) : (
          <table className="directory-table">
            <thead>
              <tr>
                <th>System ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Direct Telephone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td><code>#{customer.id}</code></td>
                  <td><strong>{customer.name}</strong></td>
                  <td><a href={`mailto:${customer.email}`}>{customer.email}</a></td>
                  <td>{customer.phone}</td>
                  <td>
                    <button className="delete-btn text" onClick={() => handleDelete(customer.id)}>Purge Record</button>
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

export default Customers;