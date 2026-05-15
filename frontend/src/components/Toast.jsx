import React, { useState, useEffect } from 'react';
import '../styles/Toast.css';

const Toast = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 4000); // Show for 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`toast-container ${isVisible ? 'show' : 'hide'} toast-${type}`}>
      <div className="toast-icon">
        {type === 'success' ? '✅' : '⚠️'}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={() => setIsVisible(false)}>×</button>
    </div>
  );
};

export default Toast;
