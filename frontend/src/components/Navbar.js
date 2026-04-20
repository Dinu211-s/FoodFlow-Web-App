import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiPackage, FiShoppingCart, FiBarChart2, FiSettings, FiLogIn } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/images/logo.png" alt="The Oriental Caters Logo" style={{ 
            height: '40px', 
            width: 'auto', 
            borderRadius: '4px'
          }} />
          <span className="brand-text">The Oriental Caters FoodFlow</span>
        </Link>

        <div className="navbar-menu">
          {/* 1. LINKS ACCESSIBLE TO EVERYONE (GUESTS & CUSTOMERS) */}
          {!isStaff() && (
            <Link to="/browse" className="nav-link browse-highlight">
              <FiPackage /> <span>Explore Menu</span>
              </Link>
            )}

          {user ? (
            <>
              {/* 2. STAFF ONLY LINKS */}
              {isStaff() ? (
                <>
                  <Link to="/dashboard" className="nav-link">
                    <FiBarChart2 /> Dashboard
                  </Link>
                  <Link to="/packages" className="nav-link">
                    <FiPackage /> Packages
                  </Link>
                  <Link to="/orders" className="nav-link">
                    <FiShoppingCart /> Orders
                  </Link>
                  <Link to="/inventory" className="nav-link">
                    <FiSettings /> Inventory
                  </Link>
                </>
              ) : (
                /* 3. CUSTOMER ONLY LINKS (Logged In) */
                <>
                  <Link to="/my-orders" className="nav-link">
                    <FiShoppingCart /> My Orders
                  </Link>
                </>
              )}
              
              <div className="navbar-user">
                <FiUser />
                <span className="user-name">{user.full_name}</span>
                <button onClick={handleLogout} className="btn-logout">
                  <FiLogOut /> Logout
                </button>
              </div>
            </>
          ) : (
            /* 4. GUEST ONLY LINKS (Not Logged In) */
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-outline btn-sm">
                <FiLogIn style={{ marginRight: '5px' }} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;