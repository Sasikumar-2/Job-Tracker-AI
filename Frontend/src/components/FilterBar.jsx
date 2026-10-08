// Filter Bar component with View Switcher

const STATUSES = ['All', 'Saved', 'Applied', 'Interviewing', 'Offered', 'Rejected'];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  applications,
  viewMode,
  onViewModeChange,
  onOpenNewModal,
  onExportCSV,
}) {
  return (
    <div className="d-flex flex-column gap-2 mb-3">
      {/* Top Search & Filter Pills Row */}
      <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-2">
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <span
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="app-input"
            style={{ paddingLeft: 28, fontSize: '12px' }}
            placeholder="Search role, company, location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls: View Switcher (Board vs Table) & Add/Export Buttons */}
        <div className="d-flex align-items-center justify-content-between justify-content-md-end gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => onViewModeChange('board')}
              title="Kanban Board View"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
              Board
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => onViewModeChange('table')}
              title="Table List View"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Table
            </button>
          </div>

          <div className="d-flex align-items-center gap-1">
            {/* Export CSV */}
            <button
              type="button"
              className="btn-secondary-custom px-2 py-1"
              onClick={onExportCSV}
              title="Export applications to CSV"
              style={{ fontSize: '12px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="d-none d-sm-inline">Export</span> CSV
            </button>

            {/* Add Position */}
            <button
              type="button"
              className="btn-primary-custom px-2 px-sm-3 py-1"
              onClick={onOpenNewModal}
              style={{ fontSize: '12px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Position
            </button>
          </div>
        </div>
      </div>

      {/* Horizontally scrollable status filter pills (smooth on phones) */}
      <div className="scrollable-chips py-1">
        {STATUSES.map((status) => {
          const count = status === 'All'
            ? applications.length
            : applications.filter((a) => a.status === status).length;
          const isActive = selectedStatus === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              style={{
                background: isActive ? '#0f172a' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-body)',
                border: isActive ? '1px solid #0f172a' : '1px solid var(--border-card)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: isActive ? 'none' : 'var(--shadow-xs)',
                flexShrink: 0,
                transition: 'all 0.1s ease',
              }}
            >
              <span>{status}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: isActive ? '#94a3b8' : 'var(--text-muted)',
                  background: isActive ? 'rgba(255, 255, 255, 0.15)' : '#f1f5f9',
                  padding: '0 4px',
                  borderRadius: 3,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
