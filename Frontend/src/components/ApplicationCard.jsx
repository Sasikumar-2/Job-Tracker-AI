import { useState } from 'react';

const STAGES = ['Saved', 'Applied', 'Interviewing', 'Offered', 'Rejected'];

export default function ApplicationCard({
  app,
  onStatusChange,
  onAnalyze,
  onDelete,
  onViewDetails,
  isAnalyzing,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const companyInitial = app.company_name ? app.company_name[0].toUpperCase() : '?';

  const matchingSkills = Array.isArray(app.analysis?.matching_skills) ? app.analysis.matching_skills : [];
  const missingSkills = Array.isArray(app.analysis?.missing_skills) ? app.analysis.missing_skills : [];
  const matchScore = app.analysis?.match_score;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', String(app.id));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onViewDetails(app)}
      style={{ cursor: 'pointer' }}
    >
      {/* Top Header: Avatar + Company + Role + Delete */}
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
          <div className="company-avatar">
            {companyInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="fw-semibold text-truncate"
              style={{ fontSize: '13px', color: 'var(--text-main)' }}
              title={app.company_name}
            >
              {app.company_name}
            </div>
            <div
              className="text-truncate text-muted"
              style={{ fontSize: '12px' }}
              title={app.job_title}
            >
              {app.job_title}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-danger-ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(app.id);
          }}
          title="Delete position"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Metadata Badges: Location, Salary, URL */}
      <div className="d-flex flex-wrap gap-1 mb-2">
        {app.location && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: '#f1f5f9',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            {app.location}
          </span>
        )}
        {app.salary_range && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: '#f1f5f9',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            {app.salary_range}
          </span>
        )}
        {app.job_url && (
          <a
            href={app.job_url.startsWith('http') ? app.job_url : `https://${app.job_url}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: '11px',
              color: '#1d4ed8',
              textDecoration: 'none',
              background: '#eff6ff',
              padding: '1px 6px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            Link ↗
          </a>
        )}
      </div>

      {/* ATS Match Section */}
      <div className="pt-2 pb-1 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
        {app.analysis ? (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Resume Fit</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: matchScore >= 70 ? '#15803d' : '#854d0e',
                  background: matchScore >= 70 ? '#f0fdf4' : '#fefce8',
                  border: `1px solid ${matchScore >= 70 ? '#bbf7d0' : '#fef08a'}`,
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {matchScore}% Match
              </span>
            </div>

            {/* Top matching & missing skill chips */}
            <div className="mb-1">
              {matchingSkills.slice(0, 2).map((skill) => (
                <span key={skill} className="skill-chip skill-chip-matched">
                  ✓ {skill}
                </span>
              ))}
              {missingSkills.slice(0, 2).map((skill) => (
                <span key={skill} className="skill-chip skill-chip-missing">
                  + {skill}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-secondary-custom w-100"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(app.id);
            }}
            disabled={isAnalyzing}
            style={{ fontSize: '11px' }}
          >
            {isAnalyzing ? 'Evaluating...' : 'Evaluate Match'}
          </button>
        )}
      </div>

      {/* Stage Selector Footer */}
      <div className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Stage:</span>
        <select
          className="app-input py-0 px-2"
          style={{ width: 'auto', fontSize: '11px', height: 24, border: '1px solid var(--border-card)' }}
          value={app.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(app.id, e.target.value);
          }}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
