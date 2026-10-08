import { useState } from 'react';

const DEFAULT_ROUNDS = [
  'Recruiter Phone Screen',
  'Technical Assessment / Coding',
  'System Design & Architecture',
  'Hiring Manager / Team Interview',
  'Executive / Offer Discussion',
];

export default function ApplicationDetailDrawer({
  app,
  isOpen,
  onClose,
  onUpdateNotes,
  onStatusChange,
}) {
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState(() => app?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(() => {
    try {
      if (app?.notes && app.notes.includes('[ROUNDS:')) {
        const match = app.notes.match(/\[ROUNDS:(.*?)\]/);
        if (match && match[1]) return JSON.parse(match[1]);
      }
    } catch {
      // fallback
    }
    return [];
  });

  const STAGES = ['Saved', 'Applied', 'Interviewing', 'Offered', 'Rejected'];

  if (!isOpen || !app) return null;

  const analysis = app.analysis;
  const matchingSkills = Array.isArray(analysis?.matching_skills) ? analysis.matching_skills : [];
  const missingSkills = Array.isArray(analysis?.missing_skills) ? analysis.missing_skills : [];

  const handleCopyJD = () => {
    if (app.job_description) {
      navigator.clipboard.writeText(app.job_description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleRound = async (roundName) => {
    const updated = completedRounds.includes(roundName)
      ? completedRounds.filter((r) => r !== roundName)
      : [...completedRounds, roundName];
    setCompletedRounds(updated);

    // Save with notes
    let cleanNotes = notes.replace(/\[ROUNDS:.*?\]/g, '').trim();
    const serializedNotes = `${cleanNotes}\n[ROUNDS:${JSON.stringify(updated)}]`.trim();
    if (onUpdateNotes) {
      await onUpdateNotes(app.id, serializedNotes);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      let cleanNotes = notes.replace(/\[ROUNDS:.*?\]/g, '').trim();
      const serializedNotes = completedRounds.length > 0
        ? `${cleanNotes}\n[ROUNDS:${JSON.stringify(completedRounds)}]`.trim()
        : cleanNotes;
      if (onUpdateNotes) {
        await onUpdateNotes(app.id, serializedNotes);
      }
    } finally {
      setSavingNotes(false);
    }
  };

  // Clean note display without internal metadata tag
  const displayNotes = notes.replace(/\[ROUNDS:.*?\]/g, '').trim();

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white gap-2" style={{ borderColor: 'var(--border-card)' }}>
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
            <div className="company-avatar flex-shrink-0" style={{ width: 34, height: 34, fontSize: '14px' }}>
              {app.company_name ? app.company_name[0].toUpperCase() : '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="fw-semibold text-truncate" style={{ fontSize: '15px', color: 'var(--text-main)', maxWidth: '140px' }} title={app.company_name}>
                  {app.company_name}
                </span>
                <select
                  className={`status-pill ${app.status}`}
                  style={{ border: 'none', outline: 'none', cursor: 'pointer', appearance: 'auto', fontSize: '11px' }}
                  value={app.status}
                  onChange={(e) => onStatusChange(app.id, e.target.value)}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-muted text-truncate" style={{ fontSize: '12px' }} title={app.job_title}>
                {app.job_title}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost-custom p-2 flex-shrink-0"
            onClick={onClose}
            title="Close drawer"
            style={{ fontSize: '15px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-3 p-md-4 overflow-y-auto d-flex flex-column gap-3 flex-grow-1">
          {/* Metadata Grid */}
          <div className="row g-2 p-2 bg-light rounded border" style={{ borderColor: 'var(--border-card)' }}>
            <div className="col-6">
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Location</div>
              <div className="fw-medium text-truncate" style={{ fontSize: '12px' }}>{app.location || '—'}</div>
            </div>
            <div className="col-6">
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Target Salary</div>
              <div className="fw-medium text-truncate" style={{ fontSize: '12px' }}>{app.salary_range || '—'}</div>
            </div>
            <div className="col-6">
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Applied Date</div>
              <div className="fw-medium text-truncate" style={{ fontSize: '12px' }}>{app.applied_date || '—'}</div>
            </div>
            <div className="col-6">
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Job Posting</div>
              <div>
                {app.job_url ? (
                  <a
                    href={app.job_url.startsWith('http') ? app.job_url : `https://${app.job_url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', color: '#1d4ed8', textDecoration: 'none' }}
                  >
                    Open Link ↗
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>—</span>
                )}
              </div>
            </div>
          </div>

          {/* Interview Stages Checklist */}
          <div className="p-3 rounded border bg-white" style={{ borderColor: 'var(--border-card)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold" style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                Interview Rounds Progress
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {completedRounds.length} of {DEFAULT_ROUNDS.length} completed
              </span>
            </div>
            <div className="d-flex flex-column gap-1">
              {DEFAULT_ROUNDS.map((round) => {
                const isDone = completedRounds.includes(round);
                return (
                  <label
                    key={round}
                    className="d-flex align-items-center gap-2 p-1 px-2 rounded"
                    style={{
                      cursor: 'pointer',
                      background: isDone ? '#f0fdf4' : 'transparent',
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleRound(round)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        color: isDone ? '#166534' : 'var(--text-body)',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {round}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ATS Analysis Report */}
          {analysis ? (
            <div className="p-3 rounded border bg-white" style={{ borderColor: 'var(--border-card)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-semibold" style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                  Resume Keyword & Skill Match
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: analysis.match_score >= 70 ? '#15803d' : '#854d0e',
                    background: analysis.match_score >= 70 ? '#f0fdf4' : '#fefce8',
                    border: `1px solid ${analysis.match_score >= 70 ? '#bbf7d0' : '#fef08a'}`,
                    padding: '2px 7px',
                    borderRadius: '4px',
                  }}
                >
                  {analysis.match_score}% Match
                </span>
              </div>

              {analysis.tailored_summary && (
                <p className="mb-3 text-muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
                  {analysis.tailored_summary}
                </p>
              )}

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', marginBottom: 4, textTransform: 'uppercase' }}>
                    Matched Skills ({matchingSkills.length})
                  </div>
                  <div>
                    {matchingSkills.length > 0 ? (
                      matchingSkills.map((s) => (
                        <span key={s} className="skill-chip skill-chip-matched">
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>None</span>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: 4, textTransform: 'uppercase' }}>
                    Missing Keywords ({missingSkills.length})
                  </div>
                  <div>
                    {missingSkills.length > 0 ? (
                      missingSkills.map((s) => (
                        <span key={s} className="skill-chip skill-chip-missing">
                          + {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: '#15803d' }}>All present</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center rounded border bg-light text-muted" style={{ fontSize: '12px', borderColor: 'var(--border-card)' }}>
              Resume match has not been evaluated yet.
            </div>
          )}

          {/* Recruiter Notes & Contacts */}
          <div className="p-3 rounded border bg-white" style={{ borderColor: 'var(--border-card)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold" style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                Recruiter Notes & Contact Info
              </span>
              <button
                type="button"
                className="btn-secondary-custom py-1 px-2"
                style={{ fontSize: '11px' }}
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea
              className="app-input"
              rows="3"
              style={{ fontSize: '12px', resize: 'vertical' }}
              placeholder="Contacts, interview dates, questions asked, or prep notes..."
              value={displayNotes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Full Job Description Viewer */}
          <div>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="fw-semibold" style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                Job Description
              </span>
              <button
                type="button"
                className="btn-ghost-custom py-1 px-2"
                style={{ fontSize: '11px' }}
                onClick={handleCopyJD}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div
              className="p-3 rounded font-mono border"
              style={{
                background: '#f8fafc',
                borderColor: 'var(--border-card)',
                fontSize: '11px',
                color: 'var(--text-body)',
                maxHeight: 180,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {app.job_description || 'No description provided.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-top bg-white d-flex justify-content-end" style={{ borderColor: 'var(--border-card)' }}>
          <button type="button" className="btn-secondary-custom" onClick={onClose}>
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
