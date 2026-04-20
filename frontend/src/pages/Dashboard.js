import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { 
  FiShoppingCart, FiPackage, FiAlertCircle, 
  FiDollarSign, FiTool
} from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLKR = (amount) => {
    return `LKR ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
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

  if (loading) return <div className="spinner"></div>;
  if (!stats) return <div className="container mt-4">Failed to load dashboard data</div>;

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1 style={{ color: 'var(--primary-color)' }}>The Oriental Caters Dashboard</h1>
          <p className="text-secondary">Real-time operational overview for FoodFlow</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon"><FiShoppingCart /></div>
            <div className="stat-content">
              <p className="stat-label">Total Orders (30 days)</p>
              <h2 className="stat-value">{stats.orders.total_orders}</h2>
              <p className="stat-detail">{stats.orders.pending_orders} pending</p>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon"><FiDollarSign /></div>
            <div className="stat-content">
              <p className="stat-label">Total Revenue</p>
              <h2 className="stat-value">{formatLKR(stats.orders.total_revenue)}</h2>
              <p className="stat-detail">{formatLKR(stats.orders.total_sales)} in sales</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon"><FiPackage /></div>
            <div className="stat-content">
              <p className="stat-label">Ingredients</p>
              <h2 className="stat-value">{stats.inventory.total_ingredients}</h2>
              <p className="stat-detail">{stats.inventory.low_stock_count} low stock items</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon"><FiTool /></div>
            <div className="stat-content">
              <p className="stat-label">Equipment</p>
              <h2 className="stat-value">{stats.cutlery.usable_pieces}</h2>
              <p className="stat-detail">{stats.cutlery.damaged_pieces} damaged</p>
            </div>
          </div>
        </div>

        {stats.inventory.low_stock_count > 0 && (
          <div className="alert alert-warning">
            <FiAlertCircle />
            <span>
              <strong>Low Stock Alert:</strong> You have {stats.inventory.low_stock_count} item(s) running low.
              <Link to="/inventory" className="alert-link"> View Inventory →</Link>
            </span>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Recent Orders Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Orders</h3>
              <Link to="/orders" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Event Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.length > 0 ? (
                    stats.recent_orders.map((order) => (
                      <tr key={order.order_id}>
                        <td>#{order.order_id}</td>
                        <td>{order.customer_name}</td>
                        <td>{new Date(order.event_date).toLocaleDateString()}</td>
                        <td>{formatLKR(order.total_amount)}</td>
                        <td>
                          <span className={`badge badge-${getStatusColor(order.order_status)}`}>
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center">No recent orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popular Packages Section */}
          <div className="card">
  <div className="card-header">
    <h3 className="card-title">Popular Packages</h3>
    <Link to="/packages" className="btn btn-outline btn-sm">Manage</Link>
  </div>
  <div className="popular-packages-list">
    {stats.popular_packages.length > 0 ? (
      stats.popular_packages.map((pkg, index) => {
        // 1. Convert name to lowercase for easier matching
        const name = pkg.package_name.toLowerCase();
        
        // 2. Flexible Image Picker logic
        let displayedImage = 'https://via.placeholder.com/60x60?text=Food';

        if (name.includes('iced coffee')) displayedImage = '/images/icedcoffee.png';
        else if (name.includes('milkshake')) displayedImage = '/images/milkshake.png';
        else if (name.includes('lemon')) displayedImage = '/images/lemonsoda.png';
        else if (name.includes('submarine') || name.includes('sub')) displayedImage = '/images/chickensub.png';
        else if (name.includes('sandwich')) displayedImage = '/images/vegcheesesand.png';
        else if (name.includes('biryani') || name.includes('biriyani')) displayedImage = '/images/biriyani.png';
        else if (name.includes('watalappam')) displayedImage = '/images/watalappam.png';
        else if (name.includes('hot dog')) displayedImage = '/images/hotdog.png';
        else if (pkg.image_url) {
          displayedImage = pkg.image_url.startsWith('/') ? pkg.image_url : `/${pkg.image_url}`;
        }

        return (
          <div key={`pkg-${pkg.package_id || index}`} className="popular-package-item">
            <div className="package-rank-img-wrapper" style={{ width: '55px', height: '55px', minWidth: '55px', overflow: 'hidden', borderRadius: '8px', background: '#f1f5f9' }}>
              <img 
                src={displayedImage} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "https://via.placeholder.com/60x60?text=Food";
                }}
              />
            </div>
            <div className="package-info">
              <p className="package-name" style={{ fontWeight: '600', margin: '0' }}>{pkg.package_name}</p>
              <p className="package-stats" style={{ margin: '0', fontSize: '0.85rem', color: '#64748b' }}>
                {pkg.order_count} orders • {pkg.total_quantity} servings
              </p>
            </div>
          </div>
          );
        })
      ) : (
      <p className="no-data">No package data available</p>
      )}
      </div>
      </div>
      </div>
      </div>
      </div>
  );
};

export default Dashboard;