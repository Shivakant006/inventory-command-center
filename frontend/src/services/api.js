const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Something went wrong');
  }
  return response.json();
};

export const api = {
  // Product Requests
  getProducts: () => fetch(`${API_BASE_URL}/products`).then(handleResponse),
  createProduct: (data) => fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  
  updateProduct: (id, data) => fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteProduct: (id) => fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  }).then(handleResponse),

  // Customer Requests
  getCustomers: () => fetch(`${API_BASE_URL}/customers`).then(handleResponse),
  createCustomer: (data) => fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  deleteCustomer: (id) => fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE',
  }).then(handleResponse),

  // Order Requests (Triggers the stock deduction business logic)
  createOrder: (orderData) => fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  }).then(handleResponse),
  deleteOrder: (id) => fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'DELETE',
  }).then(handleResponse),
  
  getOrders: () => fetch(`${API_BASE_URL}/orders`).then(handleResponse),

};