// web/src/Components/Admin/UsersManagement/UsersManagement.jsx
import { useState, useEffect, useMemo } from 'react';
import './UsersManagement.scss';
import { getAllUsers, updateUserByAdmin, deleteUserByAdmin } from '../../../services/adminService';
import UserEditModal from '../UserEditModal/UserEditModal';
import UserFilters from '../UserFilters/UserFilters';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    role: '',
    status: 'active',
    dateFrom: '',
    dateTo: '',
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      showToast('Ошибка загрузки пользователей', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filters.name && !user.display_name?.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }

      if (filters.role && user.role !== filters.role) {
        return false;
      }

      if (filters.status && user.status !== filters.status) {
        return false;
      }

      if (filters.dateFrom || filters.dateTo) {
        const createdDate = new Date(user.created_at);
        if (filters.dateFrom && createdDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && createdDate > new Date(filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [users, filters]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      await updateUserByAdmin(selectedUser.id, userData);
      showToast('Пользователь успешно обновлен', 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      showToast('Ошибка обновления пользователя', 'error');
      console.error(error);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        await deleteUserByAdmin(userId);
        showToast('Пользователь удален', 'success');
        loadUsers();
      } catch (error) {
        showToast('Ошибка удаления пользователя', 'error');
        console.error(error);
      }
    }
  };

  if (loading) {
    return <div className="users-loading">Загрузка...</div>;
  }

  return (
    <div className="users-management">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      
      <UserFilters filters={filters} onFiltersChange={setFilters} />

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Дата регистрации</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={`user-row ${user.status === 'deleted' ? 'deleted' : ''}`}>
                <td>{user.display_name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? 'Активен' : 'Удален'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="action-btn edit" onClick={() => handleEdit(user)}>
                    Редактировать
                  </button>
                  <button
                    className={`action-btn delete ${user.status === 'deleted' ? 'disabled' : ''}`}
                    onClick={() => handleDelete(user.id)}
                    disabled={user.status === 'deleted'}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>Пользователи не найдены</p>
          </div>
        )}
      </div>

      {showEditModal && (
        <UserEditModal
          user={selectedUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

export default UsersManagement;