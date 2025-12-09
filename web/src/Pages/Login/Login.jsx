import { useState } from 'react';
import './Login.scss';
import { loginUser } from '../../services/authService';

function Login({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        // Успешный вход - переходим на страницу профиля
        if (onNavigate) {
          onNavigate('profile');
        }
      } else {
        setError(result.error || 'Ошибка при входе');
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз');
      console.error('Ошибка входа:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  return (
    <div className="login-page">
      <div className="background-image"></div>
      <div className="login-container">
        <div className="login-form-wrapper">
          <h1 className="logo-title">KinoDors</h1>

          <div className="tab-switcher">
            <div 
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Вход
            </div>
            <div
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => onNavigate('signup')}
            >
              Регистрация
            </div>
          </div>

          <div className="tab-indicator"></div>

          <div className="form-inputs">
            <div className="input-field">
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
              />
              <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.99924 4C4.99924 2.34315 6.34239 1 7.99924 1C9.6561 1 10.9992 2.34315 10.9992 4C10.9992 5.65685 9.6561 7 7.99924 7C6.34239 7 4.99924 5.65685 4.99924 4Z" fill="var(--color-text-primary)"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M2.50007 13.4036C2.55163 10.4104 4.9939 8 7.99924 8C11.0047 8 13.447 10.4105 13.4984 13.4038C13.5018 13.6023 13.3875 13.784 13.207 13.8668C11.6211 14.5945 9.85693 15 7.99946 15C6.14182 15 4.37753 14.5945 2.79146 13.8666C2.61101 13.7838 2.49666 13.6021 2.50007 13.4036Z" fill="var(--color-text-primary)"/>
              </svg>
            </div>

            <div className="input-field">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
              <svg 
                className="input-icon clickable" 
                onClick={() => setShowPassword(!showPassword)}
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2.35355 1.64645C2.15829 1.45118 1.84171 1.45118 1.64645 1.64645C1.45118 1.84171 1.45118 2.15829 1.64645 2.35355L13.6464 14.3536C13.8417 14.5488 14.1583 14.5488 14.3536 14.3536C14.5488 14.1583 14.5488 13.8417 14.3536 13.6464L2.35355 1.64645Z" fill="var(--color-text-primary)"/>
                <path d="M15.1172 8.36887C14.7546 9.45913 14.1484 10.4383 13.3631 11.2418L11.2975 9.17615C11.4286 8.80857 11.5 8.41262 11.5 8C11.5 6.067 9.933 4.5 8 4.5C7.58738 4.5 7.19143 4.5714 6.82385 4.70253L5.17265 3.05133C6.04522 2.69587 6.99985 2.5 8.00035 2.5C11.3139 2.5 14.1243 4.64848 15.117 7.62697C15.1973 7.86768 15.1973 8.12812 15.1172 8.36887Z" fill="var(--color-text-primary)"/>
                <path d="M10.5 8C10.5 8.12011 10.4915 8.23824 10.4752 8.35383L7.64617 5.52485C7.76176 5.50847 7.87989 5.5 8 5.5C9.38071 5.5 10.5 6.61929 10.5 8Z" fill="var(--color-text-primary)"/>
                <path d="M8.35383 10.4752L5.52485 7.64617C5.50847 7.76176 5.5 7.87989 5.5 8C5.5 9.38071 6.61929 10.5 8 10.5C8.12011 10.5 8.23824 10.4915 8.35383 10.4752Z" fill="var(--color-text-primary)"/>
                <path d="M4.5 8C4.5 7.58738 4.5714 7.19143 4.70253 6.82385L2.63662 4.75794C1.85124 5.56148 1.24498 6.54076 0.882274 7.63113C0.802188 7.87188 0.802265 8.13233 0.882492 8.37303C1.87522 11.3515 4.68565 13.5 7.99918 13.5C8.9998 13.5 9.95455 13.3041 10.8272 12.9485L9.17615 11.2975C8.80857 11.4286 8.41262 11.5 8 11.5C6.067 11.5 4.5 9.933 4.5 8Z" fill="var(--color-text-primary)"/>
              </svg>
            </div>
          </div>

          <div className="forgot-password">
            Забыли пароль?
          </div>

          {error && (
            <div className="error-message" style={{ 
              color: '#ff4d4d', 
              marginTop: '16px', 
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button 
            className="login-button" 
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Вход'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
