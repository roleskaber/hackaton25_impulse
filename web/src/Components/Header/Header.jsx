import { useState, useEffect, useCallback, useRef } from 'react';
import './Header.scss';
import { getCurrentUser, onAuthStateChange } from '../../services/authService';
import SearchOverlay from '../SearchOverlay/SearchOverlay';
import { LOGO_PATH } from '../../constants/assets';
import { useCity } from '../../contexts/CityContext';

function Header({ onNavigate, currentPage = 'home' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getCurrentUser());
  const [userData, setUserData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { selectedCity, setSelectedCity } = useCity();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth <= 640;
  });
  const cityDropdownRef = useRef(null);
  const cities = [
    'Москва',
    'Санкт-Петербург',
    'Новосибирск',
    'Екатеринбург',
    'Казань',
    'Нижний Новгород',
    'Самара',
    'Омск',
    'Челябинск',
    'Ростов-на-Дону',
    'Уфа',
    'Красноярск',
    'Пермь',
    'Воронеж',
    'Волгоград'
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCityDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    const unsubscribeAuth = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUserData(user);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribeAuth?.();
    };
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navigateTo = useCallback(
    (route, anchor) => {
      if (onNavigate) {
        onNavigate(route, anchor);
      }
      closeMobileMenu();
    },
    [onNavigate]
  );

  const handleLoginClick = () => {
    const user = getCurrentUser();
    if (user) {
      navigateTo('profile');
    } else {
      navigateTo('login');
    }
  };

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);
  const handleProtectedNavigate = (route) => {
    if (isAuthenticated) {
      navigateTo(route);
      return;
    }
    navigateTo('login');
  };

  const toggleCityDropdown = () => {
    setIsCityDropdownOpen((prev) => !prev);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setIsCityDropdownOpen(false);
  };

  return (
    <>
      <header className={`header-glass ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
        <button className="logo-button" onClick={() => navigateTo('home')} aria-label="На главную">
          <img
            src={LOGO_PATH}
            alt="Logo"
            className={`logo ${isScrolled && isMobile ? 'hidden' : ''}`}
          />
        </button>

        <div className="header-location" ref={cityDropdownRef}>
          <button
            className={`location-button ${isCityDropdownOpen ? 'open' : ''}`}
            type="button"
            onClick={toggleCityDropdown}
            aria-expanded={isCityDropdownOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 10.8333C11.3807 10.8333 12.5 9.71405 12.5 8.33333C12.5 6.95262 11.3807 5.83333 10 5.83333C8.61929 5.83333 7.5 6.95262 7.5 8.33333C7.5 9.71405 8.61929 10.8333 10 10.8333Z" stroke="#EBFAFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 2.5C7.23858 2.5 5 4.73858 5 7.5C5 11.25 10 17.5 10 17.5C10 17.5 15 11.25 15 7.5C15 4.73858 12.7614 2.5 10 2.5Z" stroke="#EBFAFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{selectedCity}</span>
            <svg className="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="#EBFAFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className={`city-dropdown ${isCityDropdownOpen ? 'open' : ''}`}>
            <div className="city-dropdown-list">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`city-dropdown-item ${city === selectedCity ? 'active' : ''}`}
                  onClick={() => handleCitySelect(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="header-search">
          <div className="search-input-wrapper" onClick={openSearch}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
              <path d="M28 28L21.0711 21.0711M21.0711 21.0711C22.8807 19.2614 24 16.7614 24 14C24 8.47715 19.5228 4 14 4C8.47715 4 4 8.47715 4 14C4 19.5228 8.47715 24 14 24C16.7614 24 19.2614 22.8807 21.0711 21.0711Z" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="search-placeholder">Поиск мест и событий</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="header-action-btn achievements-btn"
            onClick={() => handleProtectedNavigate('achievements')}
            type="button"
          >
            Достижения
          </button>
          <button
            className="header-action-btn my-events-btn"
            onClick={() => handleProtectedNavigate('my-events')}
            type="button"
          >
            Мои события
          </button>
          <button
            className={`header-action-btn login-btn ${isAuthenticated ? 'is-authenticated' : 'is-guest'}`}
            onClick={handleLoginClick}
            aria-label={isAuthenticated ? 'Перейти в профиль' : 'Войти в аккаунт'}
            type="button"
          >
            {isAuthenticated ? (
              <>
                {userData?.profileImage && (
                  <img 
                    src={userData.profileImage} 
                    alt="Profile" 
                    className="profile-avatar-image"
                  />
                )}
                <span>Профиль</span>
              </>
            ) : (
              <span>Войти</span>
            )}
          </button>
        </div>

        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Меню"
          type="button"
        >
          <span className="hamburger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        </div>

        <nav className={`mobile-navigation ${isMobileMenuOpen ? 'open' : ''}`} aria-label="Мобильная навигация">
          <button className="mobile-nav-item" onClick={() => navigateTo('home')} type="button">
            <span>Главная</span>
            <span className="mobile-nav-glow" aria-hidden="true" />
          </button>
          <button className="mobile-nav-item" onClick={() => handleProtectedNavigate('my-events')} type="button">
            <span>Мои события</span>
            <span className="mobile-nav-glow" aria-hidden="true" />
          </button>
          <button className="mobile-nav-item" onClick={() => handleProtectedNavigate('achievements')} type="button">
            <span>Достижения</span>
            <span className="mobile-nav-glow" aria-hidden="true" />
          </button>
          <button className="mobile-nav-item" onClick={handleLoginClick} type="button">
            <span>{isAuthenticated ? 'Профиль' : 'Войти'}</span>
            <span className="mobile-nav-glow" aria-hidden="true" />
          </button>
        </nav>
      </header>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onNavigate={onNavigate}
      />
    </>
  );
}

export default Header;
