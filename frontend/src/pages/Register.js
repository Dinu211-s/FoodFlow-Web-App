import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Prepare data and add the 'customer' role explicitly
      const { confirmPassword, ...userData } = formData;
      const finalData = {
        ...userData,
        role: 'customer' // Ensure the backend knows this is a customer
      };

      // 2. Call the register function
      const result = await register(finalData);
      
      if (result.success) {
        // 3. Redirect to the menu so they can see the food they just scrolled to!
        navigate('/menu'); 
      } else {
        // Display specific error (e.g., "Email already exists")
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Connection lost. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Consistent background with Login page to fix the purple bars
  const pageStyle = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(rgba(142, 33, 59, 0.65), rgba(44, 62, 80, 0.75)), url('/images/registerpage.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    padding: '40px 20px'
  };

  return (
    <div style={pageStyle}>
      <div className="login-card" style={{ maxWidth: '650px' }}>
        <div className="login-header">
          {/* Branded Logo for The Oriental Caters */}
          <img 
            src="/images/logo.png" 
            alt="The Oriental Caters" 
            style={{ height: '60px', marginBottom: '15px', width: 'auto' }} 
          />
          <h2 style={{ color: 'var(--primary-color)', fontWeight: '800' }}>Join FoodFlow</h2>
          <p className="text-secondary">Create your account for The Oriental Caters</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="grid grid-2 gap-1">
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                className="custom-input"
                placeholder="Ex: Kamal Perera"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="custom-input"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-2 gap-1">
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="custom-input"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="custom-input"
                placeholder="077XXXXXXX"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Delivery Address</label>
            <textarea
              name="address"
              className="custom-input"
              placeholder="Your default location in Sri Lanka"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              style={{ resize: 'none' }}
            />
          </div>

          <div className="grid grid-2 gap-1">
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

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="custom-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? 'Creating Account...' : 'Register as Customer'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;