import React, { useState, useEffect, useRef } from 'react';
import './VerificationOverlay.scss';
import { verifyRegistrationCode } from '../../services/authService';

function VerificationOverlay({ isOpen, onClose, email, onVerifySuccess, onVerifyError }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Введите код подтверждения');
      return;
    }

    if (code.trim().length !== 6) {
      setError('Код должен содержать 6 цифр');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyRegistrationCode(email, code.trim());

      if (result.success) {
        onVerifySuccess?.(result.data);
      } else {
        setError(result.error || 'Неверный код подтверждения');
        onVerifyError?.(result.error || 'Неверный код подтверждения');
      }
    } catch (err) {
      const errorMessage = 'Произошла ошибка. Попробуйте еще раз';
      setError(errorMessage);
      onVerifyError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="verification-overlay" role="dialog" aria-modal="true">
      <div className="verification-overlay-backdrop" onClick={onClose} />
      <div className="verification-overlay-panel">
        <div className="verification-overlay-header">
          <div className="verification-input-container">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              placeholder="Введите код"
              aria-label="Код подтверждения"
              onKeyPress={handleKeyPress}
              maxLength={6}
            />
          </div>
          <button className="verification-overlay-close" onClick={onClose} type="button">
            Закрыть
          </button>
        </div>

        <div className="verification-overlay-content">
          <p className="verification-message">
            Мы отправили письмо для подтверждения вам на почту
          </p>

          {error && (
            <div className="verification-error">{error}</div>
          )}

          <button
            className="verification-button"
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            type="button"
          >
            {loading ? 'Проверка...' : 'Проверить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationOverlay;
