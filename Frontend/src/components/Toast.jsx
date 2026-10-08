// Toast notification container

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container-custom">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item ${t.type || 'info'}`}>
          <div className="d-flex align-items-center gap-2">
            {t.type === 'success' && (
              <span style={{ color: '#22c55e', fontSize: '14px' }}>✓</span>
            )}
            {t.type === 'error' && (
              <span style={{ color: '#ef4444', fontSize: '14px' }}>✕</span>
            )}
            {(!t.type || t.type === 'info') && (
              <span style={{ color: '#60a5fa', fontSize: '14px' }}>ℹ</span>
            )}
            <span>{t.message}</span>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
