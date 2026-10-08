import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, apiUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: 'owner@vetnest.app',
    password: 'owner12345',
    petName: '',
  });
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const endpoint = isRegister ? `${apiUrl}/api/auth/owner/register` : `${apiUrl}/api/auth/owner/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vetnest_owner_token', data.token);
        localStorage.setItem('vetnest_owner_user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Network error, please check connection.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {isRegister ? '🐾 Pet Owner Registration' : '🐾 Pet Owner Sign In'}
          </h2>
          <button className="btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Your Full Name *</label>
              <input
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Pet Name</label>
              <input
                className="form-input"
                value={formData.petName}
                onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                placeholder="e.g. Bruno"
              />
            </div>
          )}

          <button type="submit" className="btn-teal" style={{ width: '100%', marginTop: '12px' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '14px', color: 'var(--text-muted)' }}>
            {isRegister ? 'Already registered?' : "Don't have an account?"}{' '}
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--teal-primary)', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Sign In Here' : 'Register Here'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
