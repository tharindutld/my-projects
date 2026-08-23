import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

/**
 * Custom ToastAlert component for displaying error and success feedback messages
 * Replaces browser native alert() popups
 */
export default function ToastAlert({ type = 'error', message, onClose }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      marginBottom: '20px',
      background: isSuccess ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
      border: isSuccess ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
      color: isSuccess ? '#4ade80' : '#f87171',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.8 }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
