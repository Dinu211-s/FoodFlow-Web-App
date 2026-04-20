import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import { FiCalendar, FiClock, FiMapPin, FiCreditCard } from 'react-icons/fi';
import './Checkout.css';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, totalAmount } = location.state || { cart: [], totalAmount: 0 };

  const [formData, setFormData] = useState({
    event_date: '',
    event_time: '',
    delivery_address: '',
    payment_method: 'cash',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        ...formData,
        items: cart.map(item => ({
          package_id: item.package_id,
          quantity: item.quantity,
        })),
      };

      await orderService.create(orderData);
      navigate('/my-orders', { 
        state: { message: 'Order placed successfully!' } 
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="container mt-4">
        <div className="card text-center">
          <p>Your cart is empty.</p>
          <button onClick={() => navigate('/browse')} className="btn btn-primary mt-2">
            Browse Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="container">
        <h1>Checkout</h1>
        
        {error && <div className="alert alert-error">{error}</div>}

        <div className="checkout-grid">
          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.package_id} className="summary-item">
                  <div className="summary-item-info">
                    <p className="summary-item-name">{item.package_name}</p>
                    <p className="summary-item-qty">Quantity: {item.quantity}</p>
                  </div>
                  {/* Changed from $ to LKR and added toLocaleString */}
                  <p className="summary-item-price">
                    LKR {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <strong>Total Amount:</strong>
              {/* Changed from $ to LKR and added toLocaleString */}
              <strong style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                LKR {totalAmount.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Order Form */}
          <div className="order-form-card">
            <h2>Event Details</h2>
            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-group">
                <label className="form-label">
                  <FiCalendar /> Event Date
                </label>
                <input
                  type="date"
                  name="event_date"
                  className="form-input"
                  value={formData.event_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiClock /> Event Time
                </label>
                <input
                  type="time"
                  name="event_time"
                  className="form-input"
                  value={formData.event_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiMapPin /> Delivery Address
                </label>
                <textarea
                  name="delivery_address"
                  className="form-textarea"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Enter full delivery address (e.g., Colombo 03)..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiCreditCard /> Payment Method
                </label>
                <select
                  name="payment_method"
                  className="form-select"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="card">Card Payment (Handheld Machine)</option>
                  <option value="online">Online Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Special Instructions (Optional)
                </label>
                <textarea
                  name="notes"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any dietary requirements or event specific notes..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate('/browse')}
                  className="btn btn-outline"
                >
                  Back to Browse
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;