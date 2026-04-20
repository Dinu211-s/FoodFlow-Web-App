import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css'; 

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Connection failed. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="login-page" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(142, 33, 59, 0.6), rgba(44, 62, 80, 0.7)), url('/images/login-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="login-card">
        <div className="login-header">
          <img 
            src="/images/logo.png" 
            alt="The Oriental Caters" 
            style={{ height: '70px', marginBottom: '15px', width: 'auto' }} 
          />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '5px' }}>Welcome Back</h2>
          <p className="text-secondary">Sign in to the FoodFlow Portal</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="custom-input"
              placeholder="e.g. admin"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="custom-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Sign up</Link>
          </p>

          {/* --- NEW SECTION START --- */}
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '15px', 
            borderTop: '1px solid #eee' 
          }}>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Just hungry?{' '}
              <Link to="/browse" style={{ 
                color: 'var(--primary-color)', 
                fontWeight: 'bold', 
                textDecoration: 'none' 
              }}>
                View our catering packages
              </Link>
              {' '}without an account.
            </p>
          </div>
          {/* --- NEW SECTION END --- */}
        </div>

        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          background: '#f8fafc', 
          borderRadius: '12px',
          border: '1px solid var(--border-light)'
        }}>
          <p style={{ fontWeight: '700', fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>
            SYSTEM ACCESS
          </p>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            <div><strong>Admin:</strong> admin / admin123</div>
            <div><strong>Staff:</strong> staff1 / admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;