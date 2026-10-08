import { useState } from 'react';

export default function NewApplicationModal({ isOpen, onClose, onSubmit }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    company_name: '',
    job_title: '',
    status: 'Saved',
    location: '',
    salary_range: '',
    job_url: '',
    applied_date: today,
    job_description: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.job_title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({
        company_name: '',
        job_title: '',
        status: 'Saved',
        location: '',
        salary_range: '',
        job_url: '',
        applied_date: today,
        job_description: '',
        notes: '',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" style={{ maxWidth: 660 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white gap-2" style={{ borderColor: 'var(--border-card)' }}>
          <div>
            <h6 className="fw-semibold mb-0" style={{ fontSize: '15px', color: 'var(--text-main)' }}>
              Add Job Application
            </h6>
            <div className="text-muted d-none d-sm-block" style={{ fontSize: '12px' }}>
              Track a new role with compensation, requirements, and recruiter notes
            </div>
          </div>
          <button type="button" className="btn-ghost-custom p-2 flex-shrink-0" onClick={onClose} style={{ fontSize: '14px', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3 p-md-4 d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Company & Role */}
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                Company Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="app-input"
                placeholder="e.g. Stripe, Figma, Datadog"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                Job Title <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="app-input"
                placeholder="e.g. Senior Software Engineer"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Location & Compensation */}
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-body)' }}>
                Location / Work Type
              </label>
              <input
                type="text"
                className="app-input"
                placeholder="e.g. Remote (US), San Francisco, CA"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-body)' }}>
                Salary / Target Range
              </label>
              <input
                type="text"
                className="app-input"
                placeholder="e.g. $140,000 - $175,000"
                value={form.salary_range}
                onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
              />
            </div>
          </div>

          {/* Stage & Date & URL */}
          <div className="row g-2">
            <div className="col-12 col-md-4">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-body)' }}>
                Pipeline Stage
              </label>
              <select
                className="app-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offered">Offered</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-body)' }}>
                Date Applied
              </label>
              <input
                type="date"
                className="app-input"
                value={form.applied_date}
                onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-body)' }}>
                Job Posting URL
              </label>
              <input
                type="url"
                className="app-input"
                placeholder="https://..."
                value={form.job_url}
                onChange={(e) => setForm({ ...form, job_url: e.target.value })}
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label mb-0" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-body)' }}>
                Job Description & Qualifications
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Used for resume skill match
              </span>
            </div>
            <textarea
              className="app-input font-mono"
              rows="4"
              style={{ fontSize: '12px', resize: 'vertical' }}
              placeholder="Paste job requirements and qualification bullet points..."
              value={form.job_description}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            ></textarea>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-body)' }}>
              Interview Notes & Contacts
            </label>
            <input
              type="text"
              className="app-input"
              placeholder="e.g. Recruiter call on Tuesday with Sarah. Focus on system design."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-end gap-2 pt-2 border-top" style={{ borderColor: 'var(--border-card)' }}>
            <button type="button" className="btn-secondary-custom" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-custom" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
