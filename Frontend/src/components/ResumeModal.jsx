import { useState } from 'react';

export default function ResumeModal({
  isOpen,
  onClose,
  initialResumeText,
  onSaveText,
  onUploadFile,
  uploading,
  savedSuccess,
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'text'
  const [textValue, setTextValue] = useState(initialResumeText || '');
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const wordCount = textValue.trim() ? textValue.trim().split(/\s+/).length : 0;

  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUploadFile(file);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    onSaveText(textValue);
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white gap-2" style={{ borderColor: 'var(--border-card)' }}>
          <div>
            <h6 className="fw-semibold mb-0" style={{ fontSize: '15px', color: 'var(--text-main)' }}>
              Candidate Resume Profile
            </h6>
            <div className="text-muted d-none d-sm-block" style={{ fontSize: '12px' }}>
              Baseline resume used to evaluate keyword fit against job descriptions
            </div>
          </div>
          <button type="button" className="btn-ghost-custom p-2 flex-shrink-0" onClick={onClose} style={{ fontSize: '14px', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Tab selection */}
        <div className="d-flex border-bottom px-3 pt-2 bg-white" style={{ borderColor: 'var(--border-card)' }}>
          <button
            type="button"
            className="btn-ghost-custom pb-2"
            style={{
              borderBottom: activeTab === 'upload' ? '2px solid #0f172a' : '2px solid transparent',
              borderRadius: 0,
              color: activeTab === 'upload' ? '#0f172a' : 'var(--text-dim)',
              fontWeight: activeTab === 'upload' ? 600 : 400,
            }}
            onClick={() => setActiveTab('upload')}
          >
            Upload PDF
          </button>
          <button
            type="button"
            className="btn-ghost-custom pb-2"
            style={{
              borderBottom: activeTab === 'text' ? '2px solid #0f172a' : '2px solid transparent',
              borderRadius: 0,
              color: activeTab === 'text' ? '#0f172a' : 'var(--text-dim)',
              fontWeight: activeTab === 'text' ? 600 : 400,
            }}
            onClick={() => setActiveTab('text')}
          >
            Raw Text Editor ({wordCount} words)
          </button>
        </div>

        {/* Body */}
        <div className="p-3 p-md-4 overflow-y-auto">
          {savedSuccess && (
            <div
              className="p-2 mb-3 rounded d-flex align-items-center gap-2 border"
              style={{
                background: '#f0fdf4',
                borderColor: '#bbf7d0',
                color: '#15803d',
                fontSize: '12px',
              }}
            >
              Resume profile successfully updated & synced.
            </div>
          )}

          {activeTab === 'upload' ? (
            <form onSubmit={handleFileSubmit} className="d-flex flex-column gap-3">
              <div
                className="p-4 rounded text-center d-flex flex-column align-items-center justify-content-center"
                style={{
                  border: '2px dashed #cbd5e1',
                  background: '#f8fafc',
                  minHeight: 160,
                }}
              >
                <div className="fw-medium mb-1" style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  {file ? file.name : 'Choose a PDF resume file'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Direct PDF in-memory extraction
                </div>
                <input
                  type="file"
                  id="resume-file-input"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                <label htmlFor="resume-file-input" className="btn-secondary-custom" style={{ cursor: 'pointer' }}>
                  Select File (.pdf)
                </label>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top" style={{ borderColor: 'var(--border-card)' }}>
                <button type="button" className="btn-secondary-custom" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-custom"
                  disabled={uploading || !file}
                >
                  {uploading ? 'Parsing...' : 'Upload & Parse PDF'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTextSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label mb-1" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                  Candidate Experience & Skills Text
                </label>
                <textarea
                  className="app-input font-mono"
                  rows="9"
                  style={{ fontSize: '12px', resize: 'vertical' }}
                  placeholder="Paste candidate resume text, skills, employment history, and education..."
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                ></textarea>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top" style={{ borderColor: 'var(--border-card)' }}>
                <button type="button" className="btn-secondary-custom" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-custom">
                  Save Resume Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
