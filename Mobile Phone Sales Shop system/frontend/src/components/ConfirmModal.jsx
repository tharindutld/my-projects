import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Custom Glassmorphic Confirmation Modal
 * Replaces native browser window.confirm() dialogs
 */
export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'primary'
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: '#f87171',
          btnBg: 'linear-gradient(135deg, #ef4444, #dc2626)'
        };
      case 'warning':
        return {
          iconColor: '#fbbf24',
          btnBg: 'linear-gradient(135deg, #f59e0b, #d97706)'
        };
      default:
        return {
          iconColor: '#818cf8',
          btnBg: 'linear-gradient(135deg, #6366f1, #4f46e5)'
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: vStyles.iconColor,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#fff' }}>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="glass-btn-secondary"
            style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              background: vStyles.btnBg,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
