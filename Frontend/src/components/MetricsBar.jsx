// Enterprise Metrics Bar

export default function MetricsBar({ applications }) {
  const total = applications.length;
  const inPipeline = applications.filter((a) => a.status === 'Applied' || a.status === 'Interviewing').length;
  const offers = applications.filter((a) => a.status === 'Offered').length;

  const analyzed = applications.filter((a) => a.analysis && typeof a.analysis.match_score === 'number');
  const avgScore = analyzed.length > 0
    ? Math.round(analyzed.reduce((acc, a) => acc + a.analysis.match_score, 0) / analyzed.length)
    : null;

  return (
    <div className="row g-2 g-md-3 mb-3">
      <div className="col-6 col-lg-3">
        <div className="kpi-card p-2 p-md-3">
          <div className="text-muted" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 2 }}>
            TOTAL APPLICATIONS
          </div>
          <div className="d-flex align-items-baseline gap-1 gap-md-2">
            <span className="fw-semibold font-mono" style={{ fontSize: '18px', color: 'var(--text-main)' }}>
              {total}
            </span>
            <span className="text-muted" style={{ fontSize: '11px' }}>tracked</span>
          </div>
        </div>
      </div>

      <div className="col-6 col-lg-3">
        <div className="kpi-card p-2 p-md-3">
          <div className="text-muted" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 2 }}>
            IN PIPELINE
          </div>
          <div className="d-flex align-items-baseline gap-1 gap-md-2">
            <span className="fw-semibold font-mono" style={{ fontSize: '18px', color: '#1d4ed8' }}>
              {inPipeline}
            </span>
            <span className="text-muted" style={{ fontSize: '11px' }}>in review</span>
          </div>
        </div>
      </div>

      <div className="col-6 col-lg-3">
        <div className="kpi-card p-2 p-md-3">
          <div className="text-muted" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 2 }}>
            OFFERS
          </div>
          <div className="d-flex align-items-baseline gap-1 gap-md-2">
            <span className="fw-semibold font-mono" style={{ fontSize: '18px', color: '#15803d' }}>
              {offers}
            </span>
            <span className="text-muted" style={{ fontSize: '11px' }}>secured</span>
          </div>
        </div>
      </div>

      <div className="col-6 col-lg-3">
        <div className="kpi-card p-2 p-md-3">
          <div className="text-muted" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 2 }}>
            AVG RESUME FIT
          </div>
          <div className="d-flex align-items-baseline gap-1 gap-md-2">
            <span className="fw-semibold font-mono" style={{ fontSize: '18px', color: avgScore !== null && avgScore >= 70 ? '#15803d' : '#854d0e' }}>
              {avgScore !== null ? `${avgScore}%` : '—'}
            </span>
            <span className="text-muted text-truncate" style={{ fontSize: '11px' }}>
              ({analyzed.length})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
