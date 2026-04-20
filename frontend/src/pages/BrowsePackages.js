import React, { useState, useEffect, useRef } from 'react'; // 1. Added useRef
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { packageService } from '../services/api';
import { FiUsers, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import './BrowsePackages.css';

const BrowsePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // 2. Created a reference for the top header section
  const headerRef = useRef(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await packageService.getAll();
      setPackages(response.data.packages);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (pkg) => {
    const existing = cart.find(item => item.package_id === pkg.package_id);
    let updatedCart;
    
    if (existing) {
      updatedCart = cart.map(item =>
        item.package_id === pkg.package_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...pkg, quantity: 1 }];
    }
    
    setCart(updatedCart);

    // 3. AUTO SCROLL LOGIC: Slides the page up to the Checkout button
    headerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const removeFromCart = (packageId) => {
    setCart(cart.filter(item => item.package_id !== packageId));
  };

  const updateQuantity = (packageId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(packageId);
    } else {
      setCart(cart.map(item =>
        item.package_id === packageId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!user) {
      localStorage.setItem('pending_cart', JSON.stringify(cart));
      alert("Please login to complete your catering order!");
      navigate('/login');
    } else {
      navigate('/checkout', { state: { cart, totalAmount: getTotalAmount() } });
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="browse-container">
      <div className="container">
        {/* 4. ATTACHED THE REF TO THE HEADER */}
        <div className="browse-header" ref={headerRef}>
          <div>
            <h1>Our Catering Packages</h1>
            <p className="text-secondary">Choose from our delicious menu options</p>
          </div>
          {cart.length > 0 && (
            <button onClick={handleCheckout} className="btn btn-primary">
              <FiShoppingCart />
              Checkout ({cart.length})
            </button>
          )}
        </div>

        {/* Shopping Cart Preview */}
        {cart.length > 0 && (
          <div className="cart-preview">
            <h3>Your Order Preview</h3>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.package_id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.package_name}</span>
                    <span className="cart-item-price">LKR {item.price} × {item.quantity}</span>
                  </div>
                  <div className="cart-item-actions">
                    <button
                      onClick={() => updateQuantity(item.package_id, item.quantity - 1)}
                      className="btn-quantity"
                    >
                      −
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.package_id, item.quantity + 1)}
                      className="btn-quantity"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.package_id)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <strong>Total:</strong>
              <strong>LKR {getTotalAmount().toLocaleString()}</strong>
            </div>
          </div>
        )}

        {/* Packages Grid */}
        <div className="packages-grid">
          {packages.map(pkg => (
            <div key={pkg.package_id} className="package-card">
              <div className="package-image">
                <img 
                  src={
                    pkg.image_url 
                      ? (pkg.image_url.startsWith('/') ? pkg.image_url : `/${pkg.image_url}`) 
                      : '/images/placeholder.jpg'
                  } 
                  alt={pkg.package_name}
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = '/images/placeholder.jpg'; 
                  }}
                />
              </div>
              <div className="package-content">
                <h3 className="package-title">{pkg.package_name}</h3>
                <p className="package-description">{pkg.description}</p>
                
                <div className="package-details">
                  <div className="package-detail">
                    <FiUsers />
                    <span>Serves {pkg.serves}</span>
                  </div>
                  <div className="package-detail">
                    <strong>LKR</strong>
                    <span>{parseFloat(pkg.price).toLocaleString()}</span>
                  </div>
                </div>

                {pkg.ingredients && pkg.ingredients.length > 0 && (
                  <div className="package-ingredients">
                    <p className="ingredients-title">Includes:</p>
                    <div className="ingredients-list">
                      {pkg.ingredients.slice(0, 3).map((ing, idx) => (
                        <span key={idx} className="ingredient-tag">
                          {ing.ingredient_name}
                        </span>
                      ))}
                      {pkg.ingredients.length > 3 && (
                        <span className="ingredient-tag">
                          +{pkg.ingredients.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => addToCart(pkg)}
                  className="btn btn-primary btn-block"
                >
                  <FiShoppingCart />
                  Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="no-packages">
            <p>No packages available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePackages;