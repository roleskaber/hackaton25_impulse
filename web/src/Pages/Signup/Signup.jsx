import { useState, useRef, useEffect } from 'react';
import './Signup.scss';
import { registerUser } from '../../services/authService';

function Signup({ onNavigate }) {
  const [step, setStep] = useState(1);
  const indicatorRef = useRef(null);
  const registerTabRef = useRef(null);
  const loginTabRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    repeatPassword: '',
    username: ''
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [customAvatarFile, setCustomAvatarFile] = useState(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleBack = () => {
    if (step === 1) {
      if (onNavigate) {
        onNavigate('login');
      }
    } else {
      setStep(step - 1);
    }
  };

  useEffect(() => {
    const updateIndicator = () => {
      if (indicatorRef.current && registerTabRef.current && loginTabRef.current) {
        const activeTabElement = registerTabRef.current;
        const tabSwitcher = activeTabElement.parentElement;
        const tabSwitcherLeft = tabSwitcher.getBoundingClientRect().left;
        const activeTabLeft = activeTabElement.getBoundingClientRect().left;
        const activeTabWidth = activeTabElement.offsetWidth;
        const indicatorWidth = 130;
        const offset = activeTabLeft - tabSwitcherLeft + (activeTabWidth - indicatorWidth) / 2;
        
        indicatorRef.current.style.transform = `translateX(${offset}px)`;
        indicatorRef.current.style.width = `${indicatorWidth}px`;
      }
    };

    if (step === 1) {
      updateIndicator();
      window.addEventListener('resize', updateIndicator);
      return () => window.removeEventListener('resize', updateIndicator);
    }
  }, [step]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError(''); // Очищаем ошибку при изменении поля
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Введите имя');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Введите email');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Введите корректный email');
      return false;
    }
    if (!formData.password) {
      setError('Введите пароль');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    if (formData.password !== formData.repeatPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Введите логин');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (step === 1) {
      if (validateStep1()) {
        setError('');
        setStep(2);
      }
    } else if (step === 2) {
      // Регистрация пользователя
      await handleRegister();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Выберите файл изображения');
        return;
      }
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5MB');
        return;
      }

      setCustomAvatarFile(file);
      setSelectedProfile(9); // Устанавливаем выбранным последний кружок
      
      // Создаем превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleProfileSelect = (index) => {
    if (index === 9) {
      // Открываем проводник для выбора файла
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      setSelectedProfile(index);
      setCustomAvatarFile(null);
      setCustomAvatarPreview(null);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      let profileImage = null;

      // Если выбран готовый аватар
      if (selectedProfile !== null && selectedProfile !== 9) {
        profileImage = profileImages[selectedProfile];
      }

      // Регистрируем пользователя
      const result = await registerUser(
        formData.email,
        formData.password,
        {
          name: formData.name,
          username: formData.username,
          profileImage: profileImage
        }
      );

      if (result.success) {
        setStep(3);
        // Через 2 секунды переходим на страницу профиля
        setTimeout(() => {
          if (onNavigate) {
            onNavigate('profile');
          }
        }, 2000);
      } else {
        setError(result.error || 'Ошибка при регистрации');
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз');
      console.error('Ошибка регистрации:', err);
    } finally {
      setLoading(false);
    }
  };

  const profileImages = [
    'https://api.builder.io/api/v1/image/assets/TEMP/5639f72a05cc427f2c4a0e2ab56c0af9d82688ab?width=476',
    'https://api.builder.io/api/v1/image/assets/TEMP/ec0409b0a345b13fba9ff22b4063e1e7f3b1d576?width=326',
    'https://api.builder.io/api/v1/image/assets/TEMP/9bbad3dd0a08923ccf3efbb28045ad9db8f3b3dd?width=422',
    'https://api.builder.io/api/v1/image/assets/TEMP/aec7cd4d81f03e6d49550ef5f2227e8f86101a54?width=512',
    'https://api.builder.io/api/v1/image/assets/TEMP/e4a79f708e1c049ab12cb94fbd695d723d243b8a?width=568',
    'https://api.builder.io/api/v1/image/assets/TEMP/56b6d31bed84870767f2c4357caa91040ea31e8b?width=344',
    'https://api.builder.io/api/v1/image/assets/TEMP/6de9aeca1ff7f82bc5f68a56a4352e9b4425f0f8?width=342',
    'https://api.builder.io/api/v1/image/assets/TEMP/1a183084036e01a745a45baff8828a9f59d1a7d5?width=320',
    'https://api.builder.io/api/v1/image/assets/TEMP/03888ee66764ad10096c23ee8e994a13739b19bb?width=320'
  ];

  return (
    <div className="signup-page">
      <div className="signup-container">
        <button className="back-button" onClick={handleBack}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.8606 22.2372L3.42738 13.7954M3.42738 13.7954L11.8691 5.36219M3.42738 13.7954L23.6774 13.8057" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {step === 1 && (
          <div className="signup-step-1">
            <div className="background-image"></div>

            <div className="signup-form-wrapper">
              <div className="tab-switcher">
                <div ref={loginTabRef} className="tab" onClick={() => onNavigate('login')}>
                  Вход
                </div>
                <div ref={registerTabRef} className="tab active">
                  Регестрация
                </div>
              </div>

              <div className="tab-indicator" ref={indicatorRef}></div>

              <div className="form-inputs">
                <div className="input-field">
                  <input 
                    type="text" 
                    placeholder="Имя"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <input 
                    type="text" 
                    placeholder="Логин"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                  />
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.99924 4C4.99924 2.34315 6.34239 1 7.99924 1C9.6561 1 10.9992 2.34315 10.9992 4C10.9992 5.65685 9.6561 7 7.99924 7C6.34239 7 4.99924 5.65685 4.99924 4Z" fill="var(--color-text-primary)"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M2.50007 13.4036C2.55163 10.4104 4.9939 8 7.99924 8C11.0047 8 13.447 10.4105 13.4984 13.4038C13.5018 13.6023 13.3875 13.784 13.207 13.8668C11.6211 14.5945 9.85693 15 7.99946 15C6.14182 15 4.37753 14.5945 2.79146 13.8666C2.61101 13.7838 2.49666 13.6021 2.50007 13.4036Z" fill="var(--color-text-primary)"/>
                  </svg>
                </div>

                <div className="input-field">
                  <input 
                    type="email" 
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <input 
                    type="password" 
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <input 
                    type="password" 
                    placeholder="Повторите пароль"
                    value={formData.repeatPassword}
                    onChange={(e) => handleInputChange('repeatPassword', e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="error-message" style={{ 
                  color: '#ff4d4d', 
                  marginTop: '16px', 
                  textAlign: 'center',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <button 
                className="continue-button" 
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? 'Загрузка...' : 'Зарегистрироваться'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="signup-step-2">
            <h1 className="greeting-title">Здравствуйте {formData.name || 'Sasha'}</h1>

            <div className="user-avatar-large">
              {customAvatarPreview ? (
                <img src={customAvatarPreview} alt="Avatar" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : selectedProfile !== null && selectedProfile !== 9 ? (
                <img src={profileImages[selectedProfile]} alt="Avatar" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M46.8757 37.5C46.8757 21.967 59.4677 9.375 75.0007 9.375C90.5337 9.375 103.126 21.967 103.126 37.5C103.126 53.033 90.5337 65.625 75.0007 65.625C59.4677 65.625 46.8757 53.033 46.8757 37.5Z" fill="var(--color-text-primary)"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M23.446 125.658C23.9294 97.5973 46.8256 75 75.0007 75C103.177 75 126.073 97.5984 126.555 125.66C126.587 127.521 125.515 129.225 123.824 130.001C108.955 136.824 92.4165 140.625 75.0027 140.625C57.5874 140.625 41.0472 136.823 26.1777 129.999C24.486 129.223 23.414 127.519 23.446 125.658Z" fill="var(--color-text-primary)"/>
                </svg>
              )}
            </div>

            <div className="profile-section">
              <h2 className="profile-title">Выберите свой профиль</h2>

              {/* Скрытый input для выбора файла */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div className="profile-grid">
                <div className="profile-row">
                  {profileImages.slice(0, 5).map((img, index) => (
                    <div 
                      key={index} 
                      className={`profile-avatar ${selectedProfile === index ? 'selected' : ''}`}
                      onClick={() => handleProfileSelect(index)}
                    >
                      <img src={img} alt="" />
                    </div>
                  ))}
                </div>
                <div className="profile-row">
                  {profileImages.slice(5, 9).map((img, index) => (
                    <div 
                      key={index + 5} 
                      className={`profile-avatar ${selectedProfile === index + 5 ? 'selected' : ''}`}
                      onClick={() => handleProfileSelect(index + 5)}
                    >
                      <img src={img} alt="" />
                    </div>
                  ))}
                  <div 
                    className={`profile-avatar add-photo ${selectedProfile === 9 ? 'selected' : ''}`}
                    onClick={() => handleProfileSelect(9)}
                  >
                    {customAvatarPreview ? (
                      <img src={customAvatarPreview} alt="Custom avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M6.25 25C6.25 19.8223 10.4473 15.625 15.625 15.625H84.375C89.5527 15.625 93.75 19.8223 93.75 25V75C93.75 80.1777 89.5527 84.375 84.375 84.375H15.625C10.4473 84.375 6.25 80.1777 6.25 75V25ZM12.5 66.9194V75C12.5 76.7259 13.8991 78.125 15.625 78.125H84.375C86.1009 78.125 87.5 76.7259 87.5 75V66.9194L76.2944 55.7138C73.8536 53.2731 69.8964 53.2731 67.4556 55.7138L63.7944 59.375L67.8347 63.4153C69.0551 64.6357 69.0551 66.6143 67.8347 67.8347C66.6143 69.0551 64.6357 69.0551 63.4153 67.8347L41.9194 46.3388C39.4786 43.8981 35.5214 43.8981 33.0806 46.3388L12.5 66.9194ZM54.6875 34.375C54.6875 31.7862 56.7862 29.6875 59.375 29.6875C61.9638 29.6875 64.0625 31.7862 64.0625 34.375C64.0625 36.9638 61.9638 39.0625 59.375 39.0625C56.7862 39.0625 54.6875 36.9638 54.6875 34.375Z" fill="var(--color-text-primary)"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="error-message" style={{ 
                  color: '#ff4d4d', 
                  marginTop: '16px', 
                  textAlign: 'center',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <button 
                className="continue-button" 
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? 'Регистрация...' : 'Завершить регистрацию'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="signup-step-3">
            <div className="success-avatar">
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/30c7063a650e0423bbb53a0f0afe6e3af7c82e13?width=534" alt="" />
            </div>

            <div className="success-name">{formData.name || 'Sasha'}</div>

            <h1 className="success-message">Ваш аккаунт был успешно создан</h1>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
