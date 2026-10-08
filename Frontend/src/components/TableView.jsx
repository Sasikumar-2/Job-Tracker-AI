import { useState } from 'react';

const STAGES = ['Saved', 'Applied', 'Interviewing', 'Offered', 'Rejected'];

export default function TableView({
  applications,
  onStatusChange,
  onAnalyze,
  onDelete,
  onViewDetails,
  loadingId,
}) {
  const [sortKey, setSortKey] = useState('applied_date');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedApplications = [...applications].sort((a, b) => {
    let valA = a[sortKey] || '';
    let valB = b[sortKey] || '';

    if (sortKey === 'match_score') {
      valA = a.analysis?.match_score || 0;
      valB = b.analysis?.match_score || 0;
    }

    if (typeof valA === 'string') {
      const cmp = valA.localeCompare(String(valB));
      return sortDir === 'asc' ? cmp : -cmp;
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const renderSortIndicator = (key) => {
    if (sortKey !== key) return null;
    return <span style={{ fontSize: '10px', marginLeft: 3 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  if (applications.length === 0) {
    return (
      <div
        className="p-5 text-center bg-white rounded border"
        style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
      >
        <p className="mb-1 fw-medium" style={{ fontSize: '14px' }}>No applications match criteria</p>
        <p className="mb-0 text-dim" style={{ fontSize: '12px' }}>Add a new position or reset your search filters.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="enterprise-table" style={{ minWidth: 680 }}>
        <thead>
          <tr>
            <th
              style={{ width: '22%', cursor: 'pointer' }}
              onClick={() => handleSort('company_name')}
            >
              Company & Role {renderSortIndicator('company_name')}
            </th>
            <th
              style={{ width: '14%', cursor: 'pointer' }}
              onClick={() => handleSort('status')}
            >
              Stage {renderSortIndicator('status')}
            </th>
            <th
              style={{ width: '15%', cursor: 'pointer' }}
              onClick={() => handleSort('location')}
            >
              Location {renderSortIndicator('location')}
            </th>
            <th
              style={{ width: '13%', cursor: 'pointer' }}
              onClick={() => handleSort('salary_range')}
            >
              Compensation {renderSortIndicator('salary_range')}
            </th>
            <th
              style={{ width: '14%', cursor: 'pointer' }}
              onClick={() => handleSort('match_score')}
            >
              ATS Fit {renderSortIndicator('match_score')}
            </th>
            <th
              style={{ width: '11%', cursor: 'pointer' }}
              onClick={() => handleSort('applied_date')}
            >
              Applied Date {renderSortIndicator('applied_date')}
            </th>
            <th style={{ width: '11%', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedApplications.map((app) => {
            const companyInitial = app.company_name ? app.company_name[0].toUpperCase() : '?';
            const matchScore = app.analysis?.match_score;

            return (
              <tr
                key={app.id}
                onClick={() => onViewDetails(app)}
                style={{ cursor: 'pointer' }}
              >
                {/* Company & Role */}
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div className="company-avatar">
                      {companyInitial}
                    </div>
                    <div>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        {app.company_name}
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '12px' }}>
                        {app.job_title}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Stage dropdown pill */}
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className={`status-pill ${app.status}`}
                    style={{ border: 'none', outline: 'none', cursor: 'pointer', appearance: 'auto' }}
                    value={app.status}
                    onChange={(e) => onStatusChange(app.id, e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s} style={{ background: '#ffffff', color: '#0f172a' }}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Location */}
                <td>
                  <span style={{ fontSize: '12px', color: app.location ? 'var(--text-body)' : 'var(--text-dim)' }}>
                    {app.location || '—'}
                  </span>
                </td>

                {/* Salary */}
                <td>
                  <span style={{ fontSize: '12px', color: app.salary_range ? 'var(--text-body)' : 'var(--text-dim)' }}>
                    {app.salary_range || '—'}
                  </span>
                </td>

                {/* ATS Match */}
                <td onClick={(e) => e.stopPropagation()}>
                  {app.analysis ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        color: matchScore >= 70 ? '#15803d' : '#854d0e',
                        background: matchScore >= 70 ? '#f0fdf4' : '#fefce8',
                        border: `1px solid ${matchScore >= 70 ? '#bbf7d0' : '#fef08a'}`,
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      {matchScore}% Match
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-ghost-custom py-1 px-2"
                      style={{ fontSize: '11px', border: '1px solid var(--border-card)' }}
                      onClick={() => onAnalyze(app.id)}
                      disabled={loadingId === app.id}
                    >
                      {loadingId === app.id ? 'Evaluating...' : 'Evaluate'}
                    </button>
                  )}
                </td>

                {/* Applied Date */}
                <td>
                  <span style={{ fontSize: '12px', color: app.applied_date ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                    {app.applied_date || '—'}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <div className="d-flex align-items-center justify-content-end gap-1">
                    {app.job_url && (
                      <a
                        href={app.job_url.startsWith('http') ? app.job_url : `https://${app.job_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost-custom p-1"
                        title="Open Job Posting"
                      >
                        ↗
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-danger-ghost p-1"
                      onClick={() => onDelete(app.id)}
                      title="Delete Position"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
