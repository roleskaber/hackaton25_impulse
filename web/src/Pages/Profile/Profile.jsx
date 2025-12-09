import { useState, useEffect, useRef } from 'react';
import './Profile.scss';
import { getCurrentUser, onAuthStateChange, updateUserProfile, logoutUser } from '../../services/authService';
import { showSuccess, showError } from '../../Components/Toast/Toast';

function Profile({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: ''
  });
  const [customAvatarDataUrl, setCustomAvatarDataUrl] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setUser(user);
        setUserData(user);
        setFormData({
          name: user.name || '',
          username: user.username || '',
          email: user.email || ''
        });
        setLoading(false);
      } else {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        if (onNavigate) {
          onNavigate('login');
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [onNavigate]);


  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: userData?.name || '',
      username: userData?.username || '',
      email: userData?.email || ''
    });
    setCustomAvatarDataUrl(null);
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type || !file.type.startsWith('image/')) {
      setError('Выберите изображение');
      return;
    }

    // Проверка размера (максимум 2MB для data URL, чтобы не перегружать Firestore)
    if (file.size > 2 * 1024 * 1024) {
      setError('Размер файла не должен превышать 2MB');
      return;
    }

    setError('');

    // Преобразуем файл в data URL (base64)
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result содержит data URL (например: "data:image/jpeg;base64,/9j/4AAQ...")
      setCustomAvatarDataUrl(reader.result);
    };
    reader.onerror = () => {
      setError('Ошибка при чтении файла');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    if (editing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updates = {};

      // Обновляем имя
      if (formData.name !== userData?.name) {
        updates.name = formData.name;
      }

      // Обновляем логин
      if (formData.username !== userData?.username) {
        updates.username = formData.username;
      }

      // Сохраняем аватар как data URL (base64) прямо в Firestore
      if (customAvatarDataUrl) {
        // customAvatarDataUrl Сѓже содержит полный data URL (например: "data:image/jpeg;base64,...")
        updates.profileImage = customAvatarDataUrl;
      }

      // Сохраняем изменения
      if (Object.keys(updates).length > 0) {
        await updateUserProfile(updates);

        // Обновляем локальное состояние
        const updatedUserData = { ...userData, ...updates };
        setUserData(updatedUserData);
        setFormData({
          name: updatedUserData.name || '',
          username: updatedUserData.username || '',
          email: updatedUserData.email || ''
        });
        setCustomAvatarDataUrl(null);
        setSuccess('Профиль успешно обновлен');
        setEditing(false);
      } else {
        setEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении');
      console.error('Ошибка сохранения профиля:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const result = await logoutUser();
      if (result.success) {
        if (onNavigate) {
          onNavigate('home');
        }
      } else {
        setError(result.error || 'Ошибка при выходе');
      }
    } catch (err) {
      setError('Ошибка при выходе');
      console.error('Ошибка выхода:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading && !user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-message">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Редирект Сѓже произошел
  }

  // Используем новый аватар из превью или сохраненный в профиле
  // Data URL может быть как из customAvatarDataUrl (новый, еще не сохраненный), так и из userData.profileImage (Сѓже сохраненный)
  const avatarUrl = customAvatarDataUrl || userData?.profileImage || null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-button" onClick={() => onNavigate('home')}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.8606 22.2372L3.42738 13.7954M3.42738 13.7954L11.8691 5.36219M3.42738 13.7954L23.6774 13.8057" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="profile-tabs">
          <div 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="profile-content">
            <div className="user-avatar-wrapper">
              <div 
                className={`user-avatar ${editing ? 'editable' : ''}`}
                onClick={handleAvatarClick}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="avatar-image" />
                ) : (
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M62.5003 50C62.5003 29.2893 79.2896 12.5 100 12.5C120.711 12.5 137.5 29.2893 137.5 50C137.5 70.7107 120.711 87.5 100 87.5C79.2896 87.5 62.5003 70.7107 62.5003 50Z" fill="var(--color-text-primary)"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M31.2607 167.544C31.9052 130.13 62.4335 100 100 100C137.568 100 168.097 130.131 168.74 167.547C168.783 170.028 167.353 172.3 165.097 173.335C145.273 182.432 123.221 187.5 100.003 187.5C76.7825 187.5 54.7289 182.431 34.903 173.332C32.6474 172.297 31.218 170.026 31.2607 167.544Z" fill="var(--color-text-primary)"/>
                  </svg>
                )}
                {editing && (
                  <div className="avatar-edit-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L4 12V20H12L20 12L12 4Z" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 16L16 8" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <h2 className="username">{userData?.name || 'Пользователь'}</h2>

            {!editing ? (
              <div className="profile-info">
                <div className="info-item">
                  <label>Имя:</label>
                  <span>{userData?.name || 'Не указано'}</span>
                </div>
                <div className="info-item">
                  <label>Логин:</label>
                  <span>{userData?.username || 'Не указано'}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{userData?.email || 'Не указано'}</span>
                </div>
              </div>
            ) : (
              <div className="profile-form">
                <div className="form-field">
                  <label>Имя:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Введите имя"
                  />
                </div>
                <div className="form-field">
                  <label>Логин:</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Введите логин"
                  />
                </div>
                <div className="form-field">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    placeholder="Email нельзя изменить"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            {success && (
              <div className="success-message">{success}</div>
            )}

            <div className="profile-actions">
              {!editing ? (
                <>
                  <button className="edit-button" onClick={handleEdit} disabled={loading}>
                    Редактировать профиль
                  </button>
                  <button className="logout-button" onClick={handleLogout} disabled={loading}>
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <button className="save-button" onClick={handleSave} disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button className="cancel-button" onClick={handleCancel} disabled={loading}>
                    Отмена
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Profile;
