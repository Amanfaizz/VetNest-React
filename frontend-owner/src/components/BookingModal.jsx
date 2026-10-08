import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function BookingModal({ hospital, isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    petName: '',
    species: 'Dog',
    triageLevel: 'ROUTINE',
    chiefComplaint: '',
    timeSlot: '',
  });

  if (!isOpen || !hospital) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      hospitalId: hospital._id,
    });
    onClose();
    setFormData({
      petName: '',
      species: 'Dog',
      triageLevel: 'ROUTINE',
      chiefComplaint: '',
      timeSlot: '',
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              Book OPD Appointment
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--teal-dark)', fontWeight: 600 }}>
              🏥 {hospital.hospitalName} ({hospital.area})
            </p>
          </div>
          <button className="btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Pet Name *</label>
            <input
              className="form-input"
              value={formData.petName}
              onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
              placeholder="e.g. Bruno, Misty"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Species *</label>
              <select
                className="form-select"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              >
                <option value="Dog">🐶 Dog</option>
                <option value="Cat">🐱 Cat</option>
                <option value="Bird">🦜 Bird</option>
                <option value="Rabbit">🐰 Rabbit</option>
                <option value="Reptile">🦎 Reptile</option>
                <option value="Other">🐾 Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Triage Priority *</label>
              <select
                className="form-select"
                value={formData.triageLevel}
                onChange={(e) => setFormData({ ...formData, triageLevel: e.target.value })}
              >
                <option value="ROUTINE">📋 Routine OPD</option>
                <option value="PRIORITY">⚠️ Priority / Urgent</option>
                <option value="EMERGENCY">🚨 Emergency Care</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Symptoms / Reason for Visit</label>
            <input
              className="form-input"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              placeholder="e.g. Annual vaccination, loss of appetite, fever"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Time Slot</label>
            <input
              type="datetime-local"
              className="form-input"
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-teal">
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
