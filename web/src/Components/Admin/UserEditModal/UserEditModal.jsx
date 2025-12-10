// web/src/Components/Admin/UserEditModal/UserEditModal.jsx
import { useState } from 'react';
import './UserEditModal.scss';

function UserEditModal({ user, onSave, onClose }) {
  const [formData, setFormData] = useState({
    display_name: user.display_name || '',
    role: user.role || 'user',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактирование пользователя</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>ФИО</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Введите ФИО"
            />
          </div>

          <div className="form-group">
            <label>Email (не может быть изменен)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label>Роль</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary">Сохранить</button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserEditModal;