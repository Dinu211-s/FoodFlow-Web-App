import React, { useState, useEffect } from 'react';
import { ingredientService, cutleryService } from '../services/api';
import { FiAlertCircle, FiPlus, FiMinus, FiBox, FiArchive } from 'react-icons/fi';

const ManageInventory = () => {
  const [ingredients, setIngredients] = useState([]);
  const [cutlery, setCutlery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ingredients');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ingredientsRes, cutleryRes] = await Promise.all([
        ingredientService.getAll(),
        cutleryService.getAll()
      ]);
      setIngredients(ingredientsRes.data.ingredients);
      setCutlery(cutleryRes.data.cutlery);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (id, type, quantity) => {
    try {
      await ingredientService.adjustStock(id, {
        quantity: Math.abs(quantity),
        transaction_type: type,
        notes: `Manual inventory adjustment (${type})`
      });
      loadData();
    } catch (error) {
      alert('Failed to adjust stock. Please check backend connection.');
    }
  };

  const getExpiryStatus = (date) => {
    if (!date) return { label: 'N/A', color: 'inherit', isWarning: false };

    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'EXPIRED', color: '#dc2626', isWarning: true };
    if (diffDays <= 3) return { label: `Expires in ${diffDays}d`, color: '#f59e0b', isWarning: true };
    return { label: expiry.toLocaleDateString(), color: 'inherit', isWarning: false };
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="page-header">
        <h1 style={{ color: 'var(--primary-color)' }}>Inventory Control Center</h1>
        <p className="text-secondary">Real-time supply chain monitoring for The Oriental Caters</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', marginTop: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`btn ${activeTab === 'ingredients' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <FiArchive /> Ingredients & Raw Materials
        </button>
        <button
          onClick={() => setActiveTab('cutlery')}
          className={`btn ${activeTab === 'cutlery' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <FiBox /> Cutlery & Equipment
        </button>
      </div>

      {activeTab === 'ingredients' && (
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0 }}>Stock Monitoring</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Current Level</th>
                  <th>Min. Required</th>
                  <th>Unit</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => {
                  const isCritical = Number(ing.quantity_available) <= Number(ing.min_quantity);
                  const expiry = getExpiryStatus(ing.expiry_date);

                  return (
                    <tr
                      key={ing.ingredient_id}
                      style={{
                        backgroundColor: (isCritical || expiry.isWarning) ? '#fff5f5' : 'transparent'
                      }}
                    >
                      <td>{ing.ingredient_name}</td>
                      <td style={{ fontWeight: 'bold', color: isCritical ? '#dc2626' : 'inherit' }}>
                        {ing.quantity_available}
                      </td>
                      <td>{ing.min_quantity}</td>
                      <td>{ing.unit}</td>
                      <td style={{ color: expiry.color, fontWeight: expiry.isWarning ? 'bold' : 'normal' }}>
                        {expiry.label}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {isCritical && <span className="badge badge-danger">Low Stock</span>}
                          {expiry.isWarning && (
                            <span className="badge" style={{ backgroundColor: expiry.color, color: 'white' }}>
                              <FiAlertCircle /> Check Quality
                            </span>
                          )}
                          {!isCritical && !expiry.isWarning && <span className="badge badge-success">Good</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => adjustStock(ing.ingredient_id, 'add', 10)}
                            className="btn btn-secondary btn-sm"
                            title="Restock 10"
                          >
                            <FiPlus />
                          </button>
                          
                          {/* UPDATED DEDUCT BUTTON WITH SAFETY CHECK */}
                          <button
                            onClick={() => {
                              if (expiry.label === 'EXPIRED') {
                                const confirmUse = window.confirm(
                                  "⚠️ WARNING: This ingredient is EXPIRED! Are you sure you want to deduct this for use in a menu?"
                                );
                                if (!confirmUse) return;
                              }
                              adjustStock(ing.ingredient_id, 'deduct', 5);
                            }}
                            className="btn btn-outline btn-sm"
                            title="Deduct 5"
                            disabled={ing.quantity_available < 5}
                          >
                            <FiMinus />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cutlery' && (
        <div className="card" style={{ padding: '0' }}>
           <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0 }}>Equipment & Assets</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Total Asset Count</th>
                  <th>Damaged Units</th>
                  <th>Available to Use</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {cutlery.map(item => (
                  <tr key={item.cutlery_id}>
                    <td>{item.item_name}</td>
                    <td>{item.total_quantity}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ background: item.damaged_quantity > 0 ? '#fee2e2' : '#f1f5f9', color: item.damaged_quantity > 0 ? '#dc2626' : '#64748b' }}
                      >
                        {item.damaged_quantity} units
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                        {item.usable_quantity}
                      </strong>
                    </td>
                    <td><span className="badge badge-info">{item.item_type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInventory;