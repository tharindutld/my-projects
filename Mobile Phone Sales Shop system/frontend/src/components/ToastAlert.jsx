import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

/**
 * Floating ToastAlert component for auto-dismissing feedback messages
 * Positioned fixed in the top-right corner to ensure visibility during page scrolling
 */
export default function ToastAlert({ type = 'error', message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="animate-fade-in toast-floating-alert" style={{
      position: 'fixed',
      top: '90px',
      right: '24px',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      padding: '14px 20px',
      borderRadius: '16px',
      background: isSuccess 
        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(20, 83, 45, 0.96) 100%)' 
        : 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(127, 29, 29, 0.96) 100%)',
      border: isSuccess ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
      color: isSuccess ? '#4ade80' : '#f87171',
      fontSize: '15px',
      fontWeight: '600',
      boxShadow: isSuccess 
        ? '0 10px 30px rgba(34, 197, 94, 0.25), 0 0 15px rgba(0, 0, 0, 0.5)' 
        : '0 10px 30px rgba(239, 68, 68, 0.25), 0 0 15px rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(12px)',
      maxWidth: '420px',
      width: 'calc(100vw - 48px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isSuccess ? <CheckCircle2 size={22} className="flex-shrink-0 text-success" /> : <AlertCircle size={22} className="flex-shrink-0 text-danger" />}
        <span style={{ color: '#f8fafc', lineHeight: '1.4' }}>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', opacity: 0.8, padding: '4px' }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
