import React, { useState, useEffect } from 'react';
import { packageService } from '../services/api';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiSave, FiX } from 'react-icons/fi';

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [newPkg, setNewPkg] = useState({ 
    package_name: '', 
    description: '', 
    price: '', 
    serves: '', 
    image_url: '' 
  });

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

  const resetForm = () => {
    setNewPkg({ package_name: '', description: '', price: '', serves: '', image_url: '' });
    setIsEditing(false);
    setIsAdding(false);
    setCurrentId(null);
  };

  const handleEdit = (pkg) => {
    setNewPkg({
      package_name: pkg.package_name,
      description: pkg.description,
      price: pkg.price,
      serves: pkg.serves,
      image_url: pkg.image_url
    });
    setCurrentId(pkg.package_id);
    setIsEditing(true);
    setIsAdding(true); 
  };  

  const handleSave = async () => {
    if (!newPkg.package_name || !newPkg.price) {
      alert("Please enter at least a name and price.");
      return;
    }

    try {
      if (isEditing) {
        await packageService.update(currentId, newPkg);
        alert('The Oriental Caters: Package updated successfully!');
      } else {
        await packageService.create(newPkg);
        alert('The Oriental Caters: New package added to the menu!');
      }
      
      resetForm();
      loadPackages();
    } catch (error) {
      console.error('Save error:', error);
      alert('Could not save changes. Please ensure the backend is running.');
    }
  };

  const deletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await packageService.delete(id);
      loadPackages();
    } catch (error) {
      alert('Failed to delete package');
    }
  };

  if (loading) return <div className="spinner"></div>;

  // --- VIEW 1: THE FORM (ADD OR EDIT) ---
  if (isAdding) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="form-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 className="form-title" style={{ color: 'var(--primary-color)' }}>
            {isEditing ? 'Update Package Details' : 'Add New Menu Package'}
          </h2>

          <div className="form-group">
            <label className="form-label">Package Name</label>
            <input 
              type="text" 
              className="custom-input"
              value={newPkg.package_name}
              onChange={(e) => setNewPkg({...newPkg, package_name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="custom-input"
              rows="3"
              value={newPkg.description}
              onChange={(e) => setNewPkg({...newPkg, description: e.target.value})}
            />
          </div>

          <div className="grid grid-2 gap-1">
            <div className="form-group">
              <label className="form-label">Price (LKR)</label>
              <input 
                type="number" 
                className="custom-input"
                value={newPkg.price}
                onChange={(e) => setNewPkg({...newPkg, price: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Serves</label>
              <input 
                type="number" 
                className="custom-input"
                value={newPkg.serves}
                onChange={(e) => setNewPkg({...newPkg, serves: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><FiImage /> Photograph Path</label>
            <input 
              type="text" 
              placeholder="/images/your-photo.jpeg"
              className="custom-input"
              value={newPkg.image_url}
              onChange={(e) => setNewPkg({...newPkg, image_url: e.target.value})}
            />
          </div>

          {newPkg.image_url && (
            <div className="package-preview" style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>Image Preview:</p>
              <img 
                src={newPkg.image_url.startsWith('/') ? newPkg.image_url : `/${newPkg.image_url}`} 
                alt="Preview"
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x150?text=Preview+Not+Found'; }}
              />
            </div>
          )}
          
          <div className="flex gap-1 mt-2">
            <button className="btn btn-primary flex-2" onClick={handleSave}>
              <FiSave /> {isEditing ? 'Update Registry' : 'Save Package'}
            </button>
            <button className="btn btn-outline flex-1" onClick={resetForm}>
              <FiX /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: THE MAIN LIST ---
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ color: 'var(--primary-color)' }}>Menu Management</h1>
          <p className="text-secondary">Update and oversee The Oriental Caters food packages</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <FiPlus /> Add Package
        </button>
      </div>

      <div className="grid grid-3">
        {packages.map(pkg => (
          <div key={pkg.package_id} className="card" style={{ padding: '0', overflow: 'hidden', borderBottom: '4px solid var(--secondary-color)' }}>
            
            {/* --- STABILIZED IMAGE CONTAINER START --- */}
            <div style={{ width: '100%', height: '180px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <img 
                key={`pkg-img-${pkg.package_id}`}
                src={
                  pkg.image_url 
                    ? (pkg.image_url.startsWith('/') ? pkg.image_url : `/${pkg.image_url}`) 
                    : 'https://via.placeholder.com/400x180?text=The+Oriental+Caters'
                } 
                alt={pkg.package_name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => { 
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/400x180?text=Image+Not+Found'; 
                }}
              />
            </div>
            {/* --- STABILIZED IMAGE CONTAINER END --- */}

            <div style={{ padding: '1.2rem' }}>
              <h3 style={{ marginBottom: '10px' }}>{pkg.package_name}</h3>
              <p className="text-secondary" style={{ fontSize: '0.9rem', minHeight: '60px' }}>
                {pkg.description}
              </p>
              <div className="flex-between mt-2">
                <span className="badge badge-info">Serves {pkg.serves}</span>
                <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                  LKR {parseFloat(pkg.price).toLocaleString()}
                </strong>
              </div>
              <div className="flex gap-1 mt-3">
                <button 
                  className="btn btn-outline btn-sm flex-1"
                  onClick={() => handleEdit(pkg)}>
                  <FiEdit /> Edit
                </button>
                <button 
                  onClick={() => deletePackage(pkg.package_id)}
                  className="btn btn-danger btn-sm"
                  style={{ background: '#fee2e2', color: '#dc2626' }}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagePackages;