import { useState } from 'react';

export default function AuthView({ onAuth, authError, isSignup, onToggleSignup }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAuth(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center p-3"
      style={{ minHeight: '100vh', background: '#f8fafc' }}
    >
      <div
        className="p-4 p-md-5 rounded bg-white"
        style={{
          width: '100%',
          maxWidth: '380px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Brand */}
        <div className="text-center mb-4">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#0f172a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h4 className="fw-semibold mb-1" style={{ fontSize: '18px', color: 'var(--text-main)' }}>
            {isSignup ? 'Create Account' : 'Sign in to Job-Tracker-AI'}
          </h4>
          <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
            Application Pipeline & Resume Match Tracker
          </p>
        </div>

        {authError && (
          <div
            className="p-2 mb-3 rounded border"
            style={{
              background: '#fef2f2',
              borderColor: '#fecaca',
              color: '#991b1b',
              fontSize: '12px',
            }}
          >
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
              Work or Personal Email
            </label>
            <input
              type="email"
              className="app-input"
              placeholder="candidate@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
              Password
            </label>
            <input
              type="password"
              className="app-input"
              placeholder="••••••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary-custom w-100 py-2 mt-1"
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            className="btn-ghost-custom"
            onClick={onToggleSignup}
            style={{ fontSize: '12px' }}
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
