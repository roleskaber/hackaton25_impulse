import { useState, useRef, useEffect } from 'react';
import './Login.scss';
import { loginUser } from '../../services/authService';

function Login({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('login');
  const indicatorRef = useRef(null);
  const loginTabRef = useRef(null);
  const registerTabRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const validateEmail = (emailValue) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailValue.trim()) {
      return 'Email обязателен для заполнения';
    }
    if (emailValue.length < 5) {
      return 'Email слишком короткий';
    }
    if (emailValue.length > 254) {
      return 'Email слишком длинный';
    }
    if (!emailRegex.test(emailValue)) {
      return 'Введите корректный email адрес';
    }
    if (emailValue.includes('..')) {
      return 'Email не может содержать две точки подряд';
    }
    if (emailValue.startsWith('.') || emailValue.endsWith('.')) {
      return 'Email не может начинаться или заканчиваться точкой';
    }
    return '';
  };

  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      return 'Пароль обязателен для заполнения';
    }
    if (passwordValue.length < 8) {
      return 'Пароль должен содержать минимум 8 символов';
    }
    if (passwordValue.length > 128) {
      return 'Пароль слишком длинный (максимум 128 символов)';
    }
    if (!/[A-Z]/.test(passwordValue) && !/[a-z]/.test(passwordValue)) {
      return 'Пароль должен содержать буквы';
    }
    if (!/[0-9]/.test(passwordValue)) {
      return 'Пароль должен содержать хотя бы одну цифру';
    }
    if (/^\s|\s$/.test(passwordValue)) {
      return 'Пароль не может начинаться или заканчиваться пробелом';
    }
    return '';
  };

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setFieldErrors({
      email: emailError,
      password: passwordError
    });

    if (emailError || passwordError) {
      setError('Исправьте ошибки в форме');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginUser(email.trim(), password);

      if (result.success) {
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

  useEffect(() => {
    const updateIndicator = () => {
      if (indicatorRef.current && loginTabRef.current && registerTabRef.current) {
        const activeTabElement = activeTab === 'login' ? loginTabRef.current : registerTabRef.current;
        const tabSwitcher = activeTabElement.parentElement;
        const tabSwitcherLeft = tabSwitcher.getBoundingClientRect().left;
        const activeTabLeft = activeTabElement.getBoundingClientRect().left;
        const activeTabWidth = activeTabElement.offsetWidth;
        const indicatorWidth = 120;
        const offset = activeTabLeft - tabSwitcherLeft + (activeTabWidth - indicatorWidth) / 2;
        
        indicatorRef.current.style.transform = `translateX(${offset}px)`;
        indicatorRef.current.style.width = `${indicatorWidth}px`;
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  return (
    <div className="login-page">
      <div className="background-image"></div>
      <div className="login-container">
        <div className="login-form-wrapper">
          <div className="tab-switcher">
            <div 
              ref={loginTabRef}
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Вход
            </div>
            <div
              ref={registerTabRef}
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => onNavigate('signup')}
            >
              Регистрация
            </div>
          </div>

          <div className="tab-indicator" ref={indicatorRef}></div>

          <div className="form-inputs">
            <div className={`input-field ${fieldErrors.email ? 'error' : ''}`}>
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  setError('');
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: validateEmail(value) });
                  }
                }}
                onBlur={() => {
                  setFieldErrors({ ...fieldErrors, email: validateEmail(email) });
                }}
              />
              <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.99924 4C4.99924 2.34315 6.34239 1 7.99924 1C9.6561 1 10.9992 2.34315 10.9992 4C10.9992 5.65685 9.6561 7 7.99924 7C6.34239 7 4.99924 5.65685 4.99924 4Z" fill="var(--color-text-primary)"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M2.50007 13.4036C2.55163 10.4104 4.9939 8 7.99924 8C11.0047 8 13.447 10.4105 13.4984 13.4038C13.5018 13.6023 13.3875 13.784 13.207 13.8668C11.6211 14.5945 9.85693 15 7.99946 15C6.14182 15 4.37753 14.5945 2.79146 13.8666C2.61101 13.7838 2.49666 13.6021 2.50007 13.4036Z" fill="var(--color-text-primary)"/>
              </svg>
              {fieldErrors.email && (
                <div className="field-error">{fieldErrors.email}</div>
              )}
            </div>

            <div className={`input-field ${fieldErrors.password ? 'error' : ''}`}>
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  setError('');
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: validatePassword(value) });
                  }
                }}
                onBlur={() => {
                  setFieldErrors({ ...fieldErrors, password: validatePassword(password) });
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
              {fieldErrors.password && (
                <div className="field-error">{fieldErrors.password}</div>
              )}
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
