// web/src/Pages/Admin/Admin.jsx
import { useState, useEffect } from 'react';
import './Admin.scss';
import UsersManagement from '../../Components/Admin/UsersManagement/UsersManagement';
import EventsManagement from '../../Components/Admin/EventsManagement/EventsManagement';
import { getCurrentUser } from '../../services/authService';

function Admin({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      onNavigate('home');
    } else {
      setIsAdmin(true);
    }
    setLoading(false);
  }, [onNavigate]);

  if (loading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Панель администратора</h1>
          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Управление пользователями
            </button>
            <button
              className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Управление событиями
            </button>
          </div>
        </div>

        <div className="admin-content">
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'events' && <EventsManagement onNavigate={onNavigate} />}
        </div>
      </div>
    </div>
  );
}

export default Admin;