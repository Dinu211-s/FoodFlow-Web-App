import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { orderService } from '../services/api';
import { FiEye, FiSettings } from 'react-icons/fi'; // Icons for better UX

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderService.getAll();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, statusData) => {
    try {
      await orderService.updateStatus(orderId, statusData);
      loadOrders();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="page-header">
        <h1 style={{ color: 'var(--primary-color)' }}>Order Management</h1>
        <p className="text-secondary">Review logistics, payments, and event confirmations</p>
      </div>

      <div className="card mt-2" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Event Date</th>
                <th>Amount</th>
                <th>Status & Details</th> {/* Updated Header */}
                <th>Manage Phase</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.order_id}>
                  <td><strong>#{order.order_id}</strong></td>
                  <td>{order.full_name || order.customer_name}</td>
                  <td>{new Date(order.event_date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold' }}>
                    LKR {parseFloat(order.total_amount).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className={`badge badge-${getStatusColor(order.order_status)}`}>
                        {order.order_status.toUpperCase()}
                      </span>
                      {/* LECTURER'S REQUEST: Check Status Button */}
                      <button 
                        onClick={() => navigate(`/orders/${order.order_id}`)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        <FiEye /> Check Status
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="flex align-center gap-1">
                      <FiSettings className="text-secondary" />
                      <select
                        value={order.order_status}
                        onChange={(e) => updateStatus(order.order_id, { order_status: e.target.value })}
                        className="form-select"
                        style={{ width: '130px', padding: '5px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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

export default ManageOrders;