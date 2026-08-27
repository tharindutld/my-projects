import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

/**
 * Centered ToastAlert Modal component for feedback messages
 * Positioned in the exact center of the screen/form with a sleek backdrop
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
    <>
      {/* Dark Overlay Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 10, 25, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 999998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Centered Modal Card */}
      <div className="animate-fade-in toast-floating-alert" style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px 32px',
        borderRadius: '24px',
        background: isSuccess 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(20, 83, 45, 0.98) 100%)' 
          : 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(127, 29, 29, 0.98) 100%)',
        border: isSuccess ? '1.5px solid rgba(34, 197, 94, 0.7)' : '1.5px solid rgba(239, 68, 68, 0.7)',
        color: isSuccess ? '#4ade80' : '#f87171',
        boxShadow: isSuccess 
          ? '0 25px 60px rgba(34, 197, 94, 0.35), 0 0 30px rgba(0, 0, 0, 0.8)' 
          : '0 25px 60px rgba(239, 68, 68, 0.35), 0 0 30px rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        maxWidth: '480px',
        width: 'calc(100vw - 48px)',
        textAlign: 'center'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              color: '#cbd5e1',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        )}

        <div className="rounded-circle p-3 d-inline-flex justify-content-center align-items-center" style={{
          background: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'
        }}>
          {isSuccess ? <CheckCircle2 size={36} className="text-success" /> : <AlertCircle size={36} className="text-danger" />}
        </div>

        <div>
          <h5 className="fw-bold mb-1" style={{ color: isSuccess ? '#4ade80' : '#f87171', fontSize: '18px' }}>
            {isSuccess ? 'Success' : 'Attention'}
          </h5>
          <p style={{ color: '#f8fafc', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
            {message}
          </p>
        </div>
      </div>
    </>
  );
}
