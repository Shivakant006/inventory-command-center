import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

    useEffect(() => {
      // Skip the debounce on the very first render if searchTerm is empty
      if (searchTerm === '' && items.length === 0) return; 

      const delayDebounceFn = setTimeout(() => {
        fetchItems(searchTerm);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

  // Fetch Items (Handles both full list and search queries)
  const fetchItems = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `${API_BASE_URL}/items?search=${query}` : `${API_BASE_URL}/items`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch data.');
      const data = await response.json();
      setItems(data);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // Initial Load
  useEffect(() => { 
    fetchItems(); 
  }, []);

  // Add New Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, quantity: parseInt(quantity), price: parseFloat(price) }),
      });
      if (response.ok) { 
        setName(''); setQuantity(''); setPrice(''); 
        fetchItems(); 
      }
    } catch (err) { alert(err.message); }
  };

  // Low Stocks
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const displayedItems = showLowStockOnly ? items.filter(i => i.quantity < 5) : items;

  // Adjust Stock (+ / -)
  const handleAdjustStock = async (itemId, val) => {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adjustment: val })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to update stock.');
      }
      const updatedItem = await response.json();
      // Update only the specific item in the local state to prevent a full re-render
      setItems(items.map(item => item.id === itemId ? updatedItem : item));
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert(error.message);
    }
  };
  // Delete Item
  const handleDeleteItem = async (itemId) => {
    // Safety check before deleting
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Remove item from UI instantly without re-fetching
        setItems(items.filter(item => item.id !== itemId));
      } else {
        throw new Error("Failed to delete item.");
      }
    } catch (err) {
      alert(err.message);
    }
  };
  // Update Price (On Blur)
  const handlePriceUpdate = async (itemId, newPrice) => {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ price: newPrice })
      });
      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(item => item.id === itemId ? updatedItem : item));
      }
    } catch (err) { 
      alert("Failed to update price"); 
    }
  };

  // KPI Calculations
  const totalItems = items.length;
  const totalStockVolume = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = items.filter(i => i.quantity < 5).length;

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1100px', margin: '0 auto', background: '#f4f7f6', minHeight: '100vh' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>📦 Inventory Command Center</h1>
      
      {/* KPI Section */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {[
          { label: 'Products', val: totalItems, color: '#3498db' },
          { label: 'Total Units', val: totalStockVolume, color: '#27ae60' },
          { label: 'Low Stock Alerts', val: lowStockCount, color: '#e74c3c' }
        ].map((kpi, i) => (
          <div key={i} style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `5px solid ${kpi.color}` }}>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e1e8ed' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>➕ Add New Inventory</h3>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text"
            placeholder="Item Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ padding: '10px', flex: 2, borderRadius: '6px', border: '1px solid #ccc' }} 
            required 
          />
          <input 
            type="number" 
            placeholder="Qty" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            style={{ padding: '10px', flex: 1, borderRadius: '6px', border: '1px solid #ccc' }} 
            required
            min="0" 
          />
          <input 
            type="number" 
            step="0.01" 
            placeholder="Price" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            style={{ padding: '10px', flex: 1, borderRadius: '6px', border: '1px solid #ccc' }} 
            required
            min="0" 
          />
          <button type="submit" style={{ padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Add Item
          </button>
        </form>
      </div>

      {/* Search & Action Bar */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Search products by name..." 
          value={searchTerm}
          // 2. UPDATE THIS ONCHANGE LINE HERE:
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ padding: '12px', flex: 1, borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '1rem' }} 
        />
        <button 
          onClick={() => {
            setSearchTerm('');
            fetchItems('');
          }} 
          style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔄 Reset View
        </button>
      </div>
      {error && (
        <div style={{ padding: '15px', background: '#fadbd8', color: '#c0392b', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          ⚠️ Error: {error}
        </div>
      )}
      {/* Data Table Section */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              {['SKU', 'Name', 'Price', 'Qty Control', 'Total Value', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '15px', color: '#2c3e50', textAlign: h === 'Actions' ? 'center' : 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px', color: '#999' }}>SKU-{item.id}00</td>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#2c3e50' }}>{item.name}</td>
                <td style={{ padding: '15px' }}>
                  ₹ <input 
                    type="number" 
                    step="0.01"
                    defaultValue={item.price.toFixed(2)}
                    onBlur={(e) => {
                        const newPrice = parseFloat(e.target.value);
                        if (isNaN(newPrice) || newPrice < 0) {
                            alert("Price must be a valid positive number.");
                            e.target.value = item.price.toFixed(2); // Reset field visually
                            return;
                        }

                        if (newPrice !== item.price) {
                            handlePriceUpdate(item.id, newPrice);
                        }
                    }}
                    style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </td>
                <td style={{ padding: '15px' }}>
                  <button onClick={() => handleAdjustStock(item.id, -1)} style={{ padding: '4px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>−</button>
                  <span style={{ margin: '0 15px', fontWeight: 'bold', fontSize: '1.1rem' }}>{item.quantity}</span>
                  <button onClick={() => handleAdjustStock(item.id, 1)} style={{ padding: '4px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>+</button>
                </td>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#7f8c8d' }}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </td>
                <td style={{ padding: '15px' }}>
                  <span 
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    style={{ 
                        padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold',
                        background: item.quantity === 0 ? '#fadbd8' : item.quantity < 5 ? '#fdebd0' : '#d4efdf',
                        color: item.quantity === 0 ? '#c0392b' : item.quantity < 5 ? '#d35400' : '#27ae60',
                        cursor: item.quantity < 5 ? 'pointer' : 'default',
                        display: 'inline-block'
                    }}>
                    {item.quantity === 0 ? 'Out of Stock' : item.quantity < 5 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete Item"
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '1.2rem',
                      color: '#e74c3c',
                      padding: '5px'
                    }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Empty State Fallback */}
        {items.length === 0 && !loading && (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d', fontSize: '1.1rem' }}>
                No items found. Adjust your search or add new inventory!
            </div>
        )}
      </div>
    </div>
  );
}

export default App;