
import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { io } from 'socket.io-client';

import {
  Building2,
  AlertTriangle,
  LogOut,
  RefreshCw,
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const PRESET_STAFF_ACCOUNTS = [
  {
    label: 'Indiranagar Branch',
    email: 'staff.indiranagar@vetnest.app',
  },
  {
    label: 'Koramangala Branch',
    email: 'staff.koramangala@vetnest.app',
  },
  {
    label: 'Jayanagar Branch',
    email: 'staff.jayanagar@vetnest.app',
  },
  {
    label: 'Whitefield Branch',
    email: 'staff.whitefield@vetnest.app',
  },
  {
    label: 'Hebbal Branch',
    email: 'staff.hebbal@vetnest.app',
  },
  {
    label: 'Malleshwaram Branch',
    email: 'staff.malleshwaram@vetnest.app',
  },
];

export default function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem('vetnest_staff_token')
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('vetnest_staff_user')
      );
    } catch {
      return null;
    }
  });

  const [email, setEmail] = useState(
    'staff.indiranagar@vetnest.app'
  );

  const [password, setPassword] = useState('staff12345');

  const [loginError, setLoginError] = useState(null);

  const [queue, setQueue] = useState([]);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Normalize hospital ID in case it is an ObjectId or object
  const hospitalId = user?.hospitalId?._id
    ? String(user.hospitalId._id)
    : user?.hospitalId
      ? String(user.hospitalId)
      : null;

  // Fetch hospital appointment queue
  const fetchHospitalQueue = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/appointments/hospital-queue`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error(
          'Queue API error:',
          data.error || res.statusText
        );
        return;
      }

      setQueue(data.data || []);
    } catch (err) {
      console.error(
        'Failed to fetch hospital queue:',
        err
      );
    }
  }, [token]);

  // Fetch hospital information
  const fetchHospitalDetails = useCallback(async () => {
    if (!hospitalId) return;

    try {
      const res = await fetch(
        `${API_URL}/api/hospitals/${hospitalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setHospitalInfo(data.data);
      } else {
        console.error(
          'Hospital details error:',
          data.error
        );
      }
    } catch (err) {
      console.error(
        'Failed to fetch hospital details:',
        err
      );
    }
  }, [hospitalId, token]);

  // Initial data loading
  useEffect(() => {
    if (token && user) {
      fetchHospitalQueue();
      fetchHospitalDetails();
    }
  }, [
    token,
    user,
    fetchHospitalQueue,
    fetchHospitalDetails,
  ]);

  // Real-time Socket.IO connection
  useEffect(() => {
    if (!token || !hospitalId) return;

    console.log(
      '[Staff Socket] Connecting to:',
      SOCKET_URL
    );

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log(
        '[Staff Socket] Connected:',
        socket.id
      );
    });

    socket.on('connect_error', (error) => {
      console.error(
        '[Staff Socket] Connection error:',
        error.message
      );
    });

    // New appointment booked by pet owner
    socket.on('appointmentCreated', (data) => {
      console.log(
        '[Staff Socket] New appointment received:',
        data
      );

      setToastMessage(
        `🆕 New Booking Received: ${data.message}`
      );

      fetchHospitalQueue();
      fetchHospitalDetails();
    });

    // Appointment status changed by staff
    socket.on('appointmentStatusUpdated', (data) => {
      console.log(
        '[Staff Socket] Appointment status updated:',
        data
      );

      fetchHospitalQueue();
      fetchHospitalDetails();

      setToastMessage(
        `Appointment ${data.appointment?.tokenNumber || ''} updated`
      );
    });

    // Hospital crowd updates
    socket.on('hospitalsUpdated', (data) => {
      if (data.updatedHospital) {
        const updatedId = String(
          data.updatedHospital._id
        );

        if (updatedId === hospitalId) {
          setHospitalInfo(data.updatedHospital);
        }
      }
    });

    return () => {
      console.log('[Staff Socket] Disconnecting');
      socket.disconnect();
    };
  }, [
    token,
    hospitalId,
    fetchHospitalQueue,
    fetchHospitalDetails,
  ]);

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const res = await fetch(
        `${API_URL}/api/auth/staff/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(
          data.error || 'Staff authentication failed.'
        );
        return;
      }

      localStorage.setItem(
        'vetnest_staff_token',
        data.token
      );

      localStorage.setItem(
        'vetnest_staff_user',
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Server connection failed.');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('vetnest_staff_token');
    localStorage.removeItem('vetnest_staff_user');

    setToken(null);
    setUser(null);
    setQueue([]);
    setHospitalInfo(null);
  };

  // Show notification
  const showToast = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Manual crowd level override
  const handleCrowdOverride = async (newLevel) => {
    if (!hospitalId) return;

    try {
      const res = await fetch(
        `${API_URL}/api/hospitals/${hospitalId}/crowd`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            crowdLevel: newLevel,
            activeQueueCount: queue.filter((q) =>
              [
                'BOOKED',
                'CHECKED_IN',
                'IN_CONSULTATION',
              ].includes(q.status)
            ).length,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setHospitalInfo(data.data);
        showToast(
          `📢 Hospital Crowd Override set to ${newLevel}`
        );
      } else {
        alert(
          data.error || 'Failed to update crowd level.'
        );
      }
    } catch (err) {
      console.error(err);
      alert('Error updating crowd level.');
    }
  };

  // Update appointment status
  const handleUpdateStatus = async (
    appointmentId,
    newStatus
  ) => {
    try {
      const res = await fetch(
        `${API_URL}/api/appointments/${appointmentId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        await fetchHospitalQueue();
        await fetchHospitalDetails();

        showToast(
          `Appointment updated to ${newStatus}` +
            (data.emailNotification === 'queued'
              ? ' • owner notified by email 📧'
              : '')
        );
      } else {
        alert(
          data.error || 'Status update failed.'
        );
      }
    } catch (err) {
      console.error(err);
      alert('Error updating appointment status.');
    }
  };

  // Login screen
  if (!token || !user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                background: '#2563eb',
                color: '#fff',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.2rem',
              }}
            >
              🏥
            </div>

            <div>
              <h1
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                }}
              >
                VetNest Staff Portal
              </h1>

              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  fontWeight: 600,
                }}
              >
                HOSPITAL RECEPTION & VET DASHBOARD
              </p>
            </div>
          </div>

          {loginError && (
            <div
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Select Clinic Branch:
              </label>

              <select
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.88rem',
                }}
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              >
                {PRESET_STAFF_ACCOUNTS.map((acc) => (
                  <option
                    key={acc.email}
                    value={acc.email}
                  >
                    {acc.label} ({acc.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Staff Password:
              </label>

              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.88rem',
                }}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
              }}
            >
              Sign In to Hospital Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activePatients = queue.filter((q) =>
    [
      'BOOKED',
      'CHECKED_IN',
      'IN_CONSULTATION',
    ].includes(q.status)
  );

  const emergencyCount = queue.filter(
    (q) =>
      q.triageLevel === 'EMERGENCY' &&
      q.status !== 'COMPLETED' &&
      q.status !== 'CANCELLED'
  ).length;

  // Dashboard
  return (
    <div className="staff-shell">
      <header className="staff-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              background: '#2563eb',
              color: '#fff',
              padding: '8px',
              borderRadius: '10px',
            }}
          >
            <Building2 size={22} />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <h1 className="clinic-title">
                {user.hospitalName ||
                  'Hospital Staff Portal'}
              </h1>

              <span className="hospital-id-pill">
                ID: {hospitalId}
              </span>
            </div>

            <p
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              Logged in as {user.name} ({user.email})
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            className="btn-sm"
            onClick={() => {
              fetchHospitalQueue();
              fetchHospitalDetails();
            }}
            title="Refresh Queue"
          >
            <RefreshCw
              size={14}
              style={{ marginRight: '4px' }}
            />
            Refresh
          </button>

          <button
            className="btn-sm"
            onClick={handleLogout}
            style={{
              color: '#ef4444',
              borderColor: '#fecaca',
            }}
          >
            <LogOut
              size={14}
              style={{ marginRight: '4px' }}
            />
            Sign Out
          </button>
        </div>
      </header>

      {toastMessage && (
        <div
          style={{
            background: '#1e293b',
            color: '#fff',
            padding: '12px 36px',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          ⚡ {toastMessage}
        </div>
      )}

      <main className="staff-body">
        <div className="crowd-control-card">
          <div>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Clinic Live Crowd Density Control
            </div>

            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '2px',
              }}
            >
              Current Broadcast:

              <span
                style={{
                  color:
                    hospitalInfo?.crowdLevel === 'LOW'
                      ? '#10b981'
                      : hospitalInfo?.crowdLevel ===
                          'MODERATE'
                        ? '#f59e0b'
                        : '#ef4444',
                }}
              >
                {hospitalInfo?.crowdLevel || 'LOW'}
              </span>

              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748b',
                }}
              >
                ({activePatients.length} Active Patients)
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              Manual Override:
            </span>

            <div className="crowd-buttons">
              {[
                'LOW',
                'MODERATE',
                'HIGH',
                'CRITICAL',
              ].map((lvl) => (
                <button
                  key={lvl}
                  className={`crowd-btn btn-${lvl} ${
                    hospitalInfo?.crowdLevel === lvl
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleCrowdOverride(lvl)
                  }
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {emergencyCount > 0 && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderLeft: '5px solid #ef4444',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <AlertTriangle
              size={24}
              color="#ef4444"
            />

            <div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#991b1b',
                }}
              >
                🚨 EMERGENCY PATIENTS IN QUEUE (
                {emergencyCount})
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#7f1d1d',
                }}
              >
                Immediate veterinary triage required for
                incoming critical cases.
              </div>
            </div>
          </div>
        )}

        <div className="queue-card">
          <div className="queue-card-header">
            <div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                }}
              >
                Hospital OPD Patient Queue
              </h2>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#64748b',
                }}
              >
                Bound strictly to Hospital ID: {hospitalId}
                {' '}• Showing {queue.length} total visits
              </p>
            </div>
          </div>

          {queue.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              No appointments scheduled for this hospital
              branch yet.
            </div>
          ) : (
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Pet Name & Species</th>
                  <th>Triage Priority</th>
                  <th>Chief Complaint</th>
                  <th>Time Slot</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'right' }}>
                    Staff Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {queue.map((apt) => (
                  <tr key={apt._id}>
                    <td>
                      <strong>{apt.tokenNumber}</strong>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {apt.petName} ({apt.species})
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                        }}
                      >
                        Owner ID:{' '}
                        {apt.ownerId?._id
                          ? apt.ownerId._id.slice(-6)
                          : 'Client'}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          apt.triageLevel === 'EMERGENCY'
                            ? 'badge-emergency'
                            : apt.triageLevel === 'PRIORITY'
                              ? 'badge-priority'
                              : 'badge-routine'
                        }`}
                      >
                        {apt.triageLevel === 'EMERGENCY'
                          ? '🚨 Emergency'
                          : apt.triageLevel === 'PRIORITY'
                            ? '⚠️ Priority'
                            : '📋 Routine'}
                      </span>
                    </td>

                    <td
                      style={{
                        maxWidth: '220px',
                        fontSize: '0.85rem',
                      }}
                    >
                      {apt.chiefComplaint}
                    </td>

                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(
                        apt.timeSlot
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          apt.status === 'COMPLETED'
                            ? 'badge-completed'
                            : apt.status ===
                                'IN_CONSULTATION'
                              ? 'badge-consult'
                              : apt.status === 'CHECKED_IN'
                                ? 'badge-checkedin'
                                : 'badge-booked'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '6px',
                        }}
                      >
                        {apt.status === 'BOOKED' && (
                          <button
                            className="btn-sm"
                            onClick={() =>
                              handleUpdateStatus(
                                apt._id,
                                'CHECKED_IN'
                              )
                            }
                          >
                            Check In
                          </button>
                        )}

                        {apt.status === 'CHECKED_IN' && (
                          <button
                            className="btn-sm"
                            style={{
                              color: '#c2410c',
                              borderColor: '#ffedd5',
                            }}
                            onClick={() =>
                              handleUpdateStatus(
                                apt._id,
                                'IN_CONSULTATION'
                              )
                            }
                          >
                            Start Consult
                          </button>
                        )}

                        {apt.status ===
                          'IN_CONSULTATION' && (
                          <button
                            className="btn-sm"
                            style={{
                              color: '#047857',
                              borderColor: '#d1fae5',
                            }}
                            onClick={() =>
                              handleUpdateStatus(
                                apt._id,
                                'COMPLETED'
                              )
                            }
                          >
                            Complete
                          </button>
                        )}

                        {![
                          'COMPLETED',
                          'CANCELLED',
                        ].includes(apt.status) && (
                          <button
                            className="btn-sm"
                            style={{ color: '#94a3b8' }}
                            onClick={() =>
                              handleUpdateStatus(
                                apt._id,
                                'CANCELLED'
                              )
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
