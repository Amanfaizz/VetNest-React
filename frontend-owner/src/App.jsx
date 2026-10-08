import React, { useState, useEffect, useCallback } from 'react';
import BengaluruMap from './components/BengaluruMap';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import { io } from 'socket.io-client';
import { MapPin, Clock, Users, Calendar, ShieldCheck, Search, Activity, User, LogOut } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function App() {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [bookingHospital, setBookingHospital] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' or 'my-appointments'

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vetnest_owner_user'));
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('vetnest_owner_token'));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [myAppointments, setMyAppointments] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Hospitals from REST API
  const fetchHospitals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/hospitals`);
      const data = await res.json();
      if (data.success) {
        setHospitals(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    }
  }, []);

  // Fetch Owner Appointments
  const fetchMyAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMyAppointments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  useEffect(() => {
    if (activeTab === 'my-appointments') {
      fetchMyAppointments();
    }
  }, [activeTab, fetchMyAppointments]);

  // Subscribe to real-time Socket.io heat map updates
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('hospitalsUpdated', (data) => {
      if (data.hospitals) {
        setHospitals(data.hospitals);
      } else if (data.updatedHospital) {
        setHospitals((prev) =>
          prev.map((h) => (h._id === data.updatedHospital._id ? data.updatedHospital : h))
        );
      }

      if (data.message) {
        setToastMessage(data.message);
        setTimeout(() => setToastMessage(null), 4000);
      }
    });

    socket.on('appointmentCreated', () => {
      if (token) fetchMyAppointments();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchMyAppointments, token]);

  const handleBookingSubmit = async (bookingData) => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(`✅ Appointment Booked! Token #${data.data.tokenNumber} assigned.`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchMyAppointments();
      } else {
        alert(data.error || 'Failed to book appointment.');
      }
    } catch (err) {
      alert('Error booking appointment. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vetnest_owner_token');
    localStorage.removeItem('vetnest_owner_user');
    setUser(null);
    setToken(null);
  };

  const filteredHospitals = hospitals.filter((h) => {
    const q = searchQuery.toLowerCase();
    return h.hospitalName.toLowerCase().includes(q) || h.area.toLowerCase().includes(q);
  });

  return (
    <div className="owner-shell">
      {/* Top Navigation */}
      <header className="owner-navbar">
        <div className="brand-container">
          <div className="brand-logo">🐾</div>
          <div>
            <div className="brand-title">VetNest</div>
            <div className="brand-slogan">Smart healthcare for every paw</div>
          </div>
        </div>

        <div className="nav-controls">
          <button
            className={`btn-outline ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <Activity size={16} style={{ marginRight: '6px' }} />
            Bengaluru Crowd Heat-Map
          </button>

          <button
            className={`btn-outline ${activeTab === 'my-appointments' ? 'active' : ''}`}
            onClick={() => {
              if (!token) setIsAuthOpen(true);
              else setActiveTab('my-appointments');
            }}
          >
            <Calendar size={16} style={{ marginRight: '6px' }} />
            My Booked Visits ({myAppointments.length})
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--teal-dark)' }}>
                👤 {user.name}
              </span>
              <button className="btn-outline" onClick={handleLogout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-teal" onClick={() => setIsAuthOpen(true)}>
              <User size={16} style={{ marginRight: '6px' }} />
              Pet Owner Sign In
            </button>
          )}
        </div>
      </header>

      {/* Real-time Toast Broadcast Bar */}
      {toastMessage && (
        <div
          style={{
            background: 'var(--text-dark)',
            color: '#fff',
            padding: '10px 24px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>⚡ LIVE CROWD UPDATE:</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace View */}
      {activeTab === 'heatmap' ? (
        <main className="owner-main">
          {/* Hospital Directory Panel */}
          <aside className="sidebar-panel">
            <div className="panel-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Bengaluru Hospitals</h2>
              <span className="badge badge-low">{filteredHospitals.length} Clinics Live</span>
            </div>

            <div style={{ padding: '12px 16px 4px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  placeholder="Search by clinic or area (e.g. Indiranagar)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="hospital-list">
              {filteredHospitals.map((h) => {
                const isSelected = selectedHospital?._id === h._id;
                const crowdClass =
                  h.crowdLevel === 'LOW'
                    ? 'badge-low'
                    : h.crowdLevel === 'MODERATE'
                    ? 'badge-moderate'
                    : 'badge-high';

                return (
                  <div
                    key={h._id}
                    className={`hospital-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedHospital(h)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="hospital-name">{h.hospitalName}</div>
                      <span className={`badge ${crowdClass}`}>{h.crowdLevel}</span>
                    </div>

                    <div className="hospital-area">📍 {h.address}</div>

                    <div className="hospital-stats">
                      <span>👥 Queue: <strong>{h.activeQueueCount} waiting</strong></span>
                      <span>⏳ Est Wait: <strong>~{h.avgWaitTimeMinutes}m</strong></span>
                    </div>

                    <button
                      className="btn-teal"
                      style={{ width: '100%', marginTop: '10px', padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingHospital(h);
                      }}
                    >
                      Book Appointment
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Leaflet Interactive Heat Map */}
          <BengaluruMap
            hospitals={filteredHospitals}
            selectedHospital={selectedHospital}
            onSelectHospital={setSelectedHospital}
            onBookClick={(h) => setBookingHospital(h)}
          />
        </main>
      ) : (
        /* Pet Owner Appointments Tracker */
        <main style={{ padding: '32px 40px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            📋 My Booked Pet Visits
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Real-time status updates broadcasted directly from clinic staff.
          </p>

          {myAppointments.length === 0 ? (
            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-line)' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No appointments booked yet.</p>
              <button className="btn-teal" style={{ marginTop: '14px' }} onClick={() => setActiveTab('heatmap')}>
                View Live Bengaluru Heat Map & Book
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myAppointments.map((apt) => (
                <div
                  key={apt._id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border-line)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--teal-dark)' }}>
                      Token #{apt.tokenNumber} • {apt.petName} ({apt.species})
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>
                      🏥 {apt.hospitalId?.hospitalName || 'Veterinary Hospital'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      📍 {apt.hospitalId?.address} • 📞 {apt.hospitalId?.contactPhone}
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '6px', color: '#475569' }}>
                      Complaint: {apt.chiefComplaint}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`badge ${
                        apt.status === 'COMPLETED'
                          ? 'badge-low'
                          : apt.status === 'IN_CONSULTATION'
                          ? 'badge-moderate'
                          : 'badge-high'
                      }`}
                      style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                    >
                      {apt.status}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Booked: {new Date(apt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Booking Form Modal */}
      <BookingModal
        hospital={bookingHospital}
        isOpen={!!bookingHospital}
        onClose={() => setBookingHospital(null)}
        onSubmit={handleBookingSubmit}
      />

      {/* Owner Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u, t) => {
          setUser(u);
          setToken(t);
        }}
        apiUrl={API_URL}
      />
    </div>
  );
}
