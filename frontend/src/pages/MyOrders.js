import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { orderService } from '../services/api';
import { FiCalendar, FiMapPin, FiDollarSign, FiXCircle, FiPlus } from 'react-icons/fi';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setTimeout(() => setMessage(''), 5000);
    }
    loadOrders();
  }, [location]);

  const loadOrders = async () => {
    try {
      const response = await orderService.getAll();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format LKR
  const formatLKR = (amount) => {
    return `LKR ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await orderService.cancel(orderId);
      setMessage('Order cancelled successfully');
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'info',
      ready: 'success',
      delivered: 'success',
      cancelled: 'danger',
    };
    return colors[status] || 'secondary';
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="my-orders-container">
      <div className="container">
        <div className="page-header flex-between">
          <div>
            <h1 style={{ color: 'var(--primary-color)' }}>The Oriental Caters: Order Registry</h1>
            <p className="text-secondary">Track and coordinate catering event supply chains</p>
          </div>
          {/* Added a button to eventually trigger a "New Order" form */}
          <button className="btn btn-primary">
            <FiPlus /> Record New Order
          </button>
        </div>

        {message && (
          <div className="alert alert-success">{message}</div>
        )}

        {orders.length > 0 ? (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.order_id} className="order-card" style={{ borderLeft: '5px solid var(--primary-color)' }}>
                <div className="order-header">
                  <div>
                    <h3>Event Order #{order.order_id}</h3>
                    <p className="order-date">
                      Logged on {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge badge-${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </div>

                <div className="order-details grid-3">
                  <div className="order-detail">
                    <FiCalendar className="detail-icon" style={{ color: 'var(--primary-color)' }} />
                    <div>
                      <p className="detail-label">Event Date</p>
                      <p className="detail-value">
                        {new Date(order.event_date).toLocaleDateString()}
                        {order.event_time && ` at ${order.event_time}`}
                      </p>
                    </div>
                  </div>

                  <div className="order-detail">
                    <FiMapPin className="detail-icon" style={{ color: 'var(--primary-color)' }} />
                    <div>
                      <p className="detail-label">Venue/Address</p>
                      <p className="detail-value">{order.delivery_address}</p>
                    </div>
                  </div>

                  <div className="order-detail">
                    <FiDollarSign className="detail-icon" style={{ color: 'var(--secondary-color)' }} />
                    <div>
                      <p className="detail-label">Billing Amount</p>
                      <p className="detail-value" style={{ fontWeight: 'bold' }}>
                        {formatLKR(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="order-items mt-2">
                    <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '5px' }}>Menu Items</h4>
                    <div className="items-list">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item">
                          <span className="item-name">{item.package_name}</span>
                          <span className="item-qty">x{item.quantity} Servings</span>
                          <span className="item-price">
                            {formatLKR(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.notes && (
                  <div className="order-notes mt-2 p-1" style={{ background: '#f8fafc', borderRadius: '8px' }}>
                    <p className="notes-label" style={{ fontWeight: '600' }}>Supply Chain Notes:</p>
                    <p className="notes-text">{order.notes}</p>
                  </div>
                )}

                {order.order_status === 'pending' && (
                  <div className="order-actions mt-2">
                    <button
                      onClick={() => handleCancelOrder(order.order_id)}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                    >
                      <FiXCircle /> Cancel Event Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders text-center mt-4">
            <p>No active catering events found in the registry.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;