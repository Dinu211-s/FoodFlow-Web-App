import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import { FiArrowLeft, FiPhone, FiDollarSign, FiCheckCircle, FiInfo, FiUser } from 'react-icons/fi';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await orderService.getById(id);
        setOrder(res.data.order);
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="spinner"></div>;
  if (!order) return <div className="container">Order not found.</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <button 
        onClick={() => navigate('/orders')} 
        className="btn btn-outline mb-2" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <FiArrowLeft /> Back to Manage Orders
      </button>

      <div className="page-header mb-2">
        <h1 style={{ color: 'var(--primary-color)' }}>Order Execution Details</h1>
        <p className="text-secondary">Ref: #ORD-{order.order_id}</p>
      </div>

      <div className="grid grid-2 gap-2">
        {/* Payment & Financials Card */}
        <div className="card" style={{ borderTop: '5px solid #10b981' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiDollarSign color="#10b981" /> Payment Status
          </h3>
          <div className="mt-2" style={{ fontSize: '1.1rem', lineHeight: '2' }}>
            <div className="flex-between">
              <span>Total Quotation:</span>
              <strong>LKR {parseFloat(order.total_amount).toLocaleString()}</strong>
            </div>
            <div className="flex-between">
              <span>Advance Received:</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                LKR {parseFloat(order.advance_amount || 0).toLocaleString()}
              </span>
            </div>
            <hr />
            <div className="flex-between" style={{ fontSize: '1.3rem' }}>
              <span>Balance Due:</span>
              <strong style={{ color: 'var(--primary-color)' }}>
                LKR {(order.total_amount - (order.advance_amount || 0)).toLocaleString()}
              </strong>
            </div>
          </div>
          <button className="btn btn-primary btn-block mt-2" style={{ background: '#10b981' }}>
            <FiCheckCircle /> Confirm Order as Valid
          </button>
        </div>

        {/* Customer Logistics Card */}
        <div className="card" style={{ borderTop: '5px solid var(--primary-color)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiUser color="var(--primary-color)" /> Customer Info
          </h3>
          
          {/* FIX: Corrected the nesting here */}
          <div style={{ marginTop: '10px' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
               <strong>{order.full_name || order.customer_name}</strong>
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPhone color="var(--primary-color)" /> 
              <a href={`tel:${order.phone}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
                {order.phone || "No phone number provided"}
              </a>
            </p>
          </div>
            
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <FiInfo /> Special Notes
            </h4>
            <p className="text-secondary" style={{ fontStyle: 'italic' }}>
              {order.notes || "No special dietary requirements or instructions provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;