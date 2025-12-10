import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';


import Header from './Components/Header/Header';
import FAQ from './Components/FAQ/FAQ';
import Footer from './Components/Footer/Footer';
import ToastContainer from './Components/Toast/Toast';
import { CityProvider } from './contexts/CityContext';
import EventDetail from './Pages/EventDetail/EventDetail';
import MyEvents from './Pages/MyEvents/MyEvents';

import Home from './Pages/Home/Home';
import Contact from './Pages/Contact/Contact';
import Login from './Pages/Login/Login';
import Signup from './Pages/Signup/Signup';
import Profile from './Pages/Profile/Profile';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageOptions, setPageOptions] = useState({});

  const handleNavigate = (page, targetId, options = {}) => {
    const wasDifferentPage = currentPage !== page;
    setCurrentPage(page);
    setPageOptions(options || {});

    if (!targetId) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }

    // Увеличиваем задержку, если переходим с другой страницы
    const delay = wasDifferentPage ? 300 : 120;
    
    const scrollToElement = (attempts = 0) => {
      const el = document.getElementById(targetId);
      if (el) {
        const headerOffset = 100;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = Math.max(0, elementPosition - headerOffset);
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else if (attempts < 10) {
        // Повторяем попытку, если элемент еще не найден
        setTimeout(() => scrollToElement(attempts + 1), 50);
      } else {
        // Если элемент не найден после всех попыток, просто скроллим вверх
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    setTimeout(() => scrollToElement(), delay);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Home onNavigate={handleNavigate} />
            <div className="gradient-section">
            </div>
          </>
        );
      case 'contact':
        return <Contact onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'signup':
        return <Signup onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} />;
      case 'event-detail':
        return <EventDetail onNavigate={handleNavigate} eventId={pageOptions.eventId} />;
      case 'my-events':
        return <MyEvents onNavigate={handleNavigate} />;
      default:
        return (
          <>
            <Home onNavigate={handleNavigate} />
            <div className="gradient-section">
              <FAQ />
            </div>
          </>
        );
    }
  };

  return (
    <>
      <Header onNavigate={handleNavigate} currentPage={currentPage} />
      {renderPage()}
      <Footer />
      <ToastContainer />
    </>
  );
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CityProvider>
    <App />
  </CityProvider>
);
