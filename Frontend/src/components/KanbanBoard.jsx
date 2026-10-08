import { useState } from 'react';
import ApplicationCard from './ApplicationCard';

const COLUMNS = [
  { id: 'Saved', label: 'Saved' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Interviewing', label: 'Interviewing' },
  { id: 'Offered', label: 'Offered' },
  { id: 'Rejected', label: 'Rejected' },
];

export default function KanbanBoard({
  applications,
  selectedStatus,
  onStatusChange,
  onAnalyze,
  onDelete,
  onViewDetails,
  loadingId,
}) {
  const [dragOverCol, setDragOverCol] = useState(null);

  const visibleColumns = selectedStatus === 'All'
    ? COLUMNS
    : COLUMNS.filter((col) => col.id === selectedStatus);

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    const rawId = e.dataTransfer.getData('text/plain');
    const appId = parseInt(rawId, 10);
    if (!isNaN(appId)) {
      onStatusChange(appId, colId);
    }
  };

  return (
    <div
      className="d-flex gap-3 align-items-start"
      style={{
        overflowX: 'auto',
        paddingBottom: 24,
      }}
    >
      {visibleColumns.map((col) => {
        const columnApps = applications.filter((app) => app.status === col.id);
        const isTarget = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            className={`kanban-col p-2 ${isTarget ? 'is-drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{
              flex: '1 0 280px',
              maxWidth: selectedStatus === 'All' ? '340px' : '580px',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {/* Column Header */}
            <div className="d-flex align-items-center justify-content-between p-2 mb-2 border-bottom bg-white rounded" style={{ borderColor: 'var(--border-card)' }}>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold" style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                  {col.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: '#f1f5f9',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {columnApps.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="d-flex flex-column" style={{ minHeight: 340 }}>
              {columnApps.length > 0 ? (
                columnApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onStatusChange={onStatusChange}
                    onAnalyze={onAnalyze}
                    onDelete={onDelete}
                    onViewDetails={onViewDetails}
                    isAnalyzing={loadingId === app.id}
                  />
                ))
              ) : (
                <div
                  className="d-flex flex-column align-items-center justify-content-center p-4 text-center rounded flex-grow-1"
                  style={{
                    border: '1px dashed #cbd5e1',
                    background: '#ffffff',
                    color: 'var(--text-dim)',
                    minHeight: 120,
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isTarget ? 'Drop here' : 'No positions'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {isTarget ? `Move to ${col.label}` : `in ${col.label.toLowerCase()}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
