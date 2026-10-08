// Enterprise Navbar component

export default function Navbar({ currentUser, onOpenResume, onLogout }) {
  const userInitial = currentUser?.email ? currentUser.email[0].toUpperCase() : 'U';

  return (
    <header className="border-bottom bg-white" style={{ borderColor: 'var(--border-card)' }}>
      <div className="container-fluid px-3 px-md-4 py-2 d-flex align-items-center justify-content-between gap-2">
        {/* Brand */}
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="d-flex align-items-center">
            <span className="fw-semibold text-nowrap" style={{ fontSize: '15px', color: 'var(--text-main)' }}>
              Job-Tracker-AI
            </span>
            <span className="text-muted ms-2 ps-2 border-start d-none d-md-inline" style={{ fontSize: '12px' }}>
              Application Tracker
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="d-flex align-items-center gap-1 gap-sm-2">
          <button
            type="button"
            className="btn-secondary-custom px-2 px-sm-3 py-1"
            onClick={onOpenResume}
            title="Edit resume profile"
            style={{ fontSize: '12px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="d-none d-sm-inline">Candidate </span>Resume
          </button>

          <div className="d-flex align-items-center gap-1 gap-sm-2 ps-2 border-start" style={{ borderColor: 'var(--border-card)' }}>
            <div className="company-avatar" style={{ width: 26, height: 26, fontSize: '11px' }}>
              {userInitial}
            </div>
            <span
              className="d-none d-lg-inline"
              style={{ fontSize: '12px', color: 'var(--text-body)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {currentUser?.email}
            </span>
            <button
              type="button"
              className="btn-ghost-custom"
              onClick={onLogout}
              style={{ fontSize: '12px' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
