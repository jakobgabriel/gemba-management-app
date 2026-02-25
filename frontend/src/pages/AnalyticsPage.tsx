import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { api } from '../api/client.js';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [resolutionTimes, setResolutionTimes] = useState<any>(null);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [breakRes, resRes, effRes] = await Promise.all([
        api.getIssueBreakdown(),
        api.getResolutionTimes().catch(() => ({ data: null })),
        api.getProductionEfficiency({}).catch(() => ({ data: null })),
      ]);
      setBreakdown(breakRes.data || []);
      setResolutionTimes(resRes.data);
      setEfficiency(effRes.data);
    } catch { /* ignore */ }
  };

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery) return;
    setLoading(true);
    try {
      const res = await api.aiQuery(aiQuery);
      setAiResults(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleGenerateReport = async (type: string) => {
    setLoading(true);
    try {
      const res = await api.aiReport(type);
      setAiReport(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div>
      {/* AI Assistant */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('aiAssistant')}</span>
        </div>
        <form onSubmit={handleAiQuery} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input className="form-input" value={aiQuery} onChange={e => setAiQuery(e.target.value)}
            placeholder={t('naturalLanguageQuery') + '...'} style={{ flex: 1 }} />
          <button className="btn btn-primary" type="submit" disabled={loading}>{t('search')}</button>
        </form>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => handleGenerateReport('resolution-times')}>
            {t('resolutionTimes')}
          </button>
          <button className="btn btn-sm" onClick={() => handleGenerateReport('category-breakdown')}>
            {t('category')} Breakdown
          </button>
          <button className="btn btn-sm" onClick={() => handleGenerateReport('escalation-analysis')}>
            Escalation Analysis
          </button>
        </div>

        {/* AI Results */}
        {aiResults && (
          <div className="info-box" style={{ marginTop: '1rem' }}>
            <div className="info-box-title">Search Results</div>
            {aiResults.summary && <p style={{ marginBottom: '1rem' }}>{aiResults.summary}</p>}
            {aiResults.results?.length > 0 ? (
              <div className="issue-list">
                {aiResults.results.map((r: any) => (
                  <div key={r.id} className="issue-item">
                    <div className="issue-header">
                      <span className="issue-title-text">#{r.issue_number} {r.title}</span>
                      <span className={`issue-badge ${r.status?.toLowerCase()}`}>{r.status}</span>
                    </div>
                    <div className="issue-meta">
                      <span>Relevance: {r.relevance}%</span>
                      <span>{r.category_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p>No matching results found.</p>}
          </div>
        )}

        {/* AI Report */}
        {aiReport && (
          <div className="info-box" style={{ marginTop: '1rem' }}>
            <div className="info-box-title">{t('generateReport')}</div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', marginTop: '0.5rem' }}>
              {typeof aiReport === 'string' ? aiReport : JSON.stringify(aiReport, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('category')} Breakdown</span>
        </div>
        {breakdown.length === 0 ? (
          <div className="empty-state">No data</div>
        ) : (
          <div>
            {breakdown.map((cat: any) => (
              <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px dashed #ccc' }}>
                <span style={{ width: '120px', fontWeight: 'bold' }}>{cat.category}</span>
                <div style={{ flex: 1, background: '#f0f0f0', height: '24px', border: '2px solid #000' }}>
                  <div style={{ width: `${cat.percentage}%`, height: '100%', background: '#000' }} />
                </div>
                <span style={{ width: '80px', textAlign: 'right' }}>{cat.count} ({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Times */}
      {resolutionTimes && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('resolutionTimes')}</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{resolutionTimes.avg_hours || 0}h</div>
              <div className="stat-label">Average</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resolutionTimes.min_hours || 0}h</div>
              <div className="stat-label">Fastest</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resolutionTimes.max_hours || 0}h</div>
              <div className="stat-label">Slowest</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resolutionTimes.total_resolved || 0}</div>
              <div className="stat-label">Total Resolved</div>
            </div>
          </div>
        </div>
      )}

      {/* Production Efficiency */}
      {efficiency && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('efficiency')}</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{efficiency.overall_efficiency || 0}%</div>
              <div className="stat-label">Overall {t('efficiency')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{efficiency.total_target || 0}</div>
              <div className="stat-label">Total {t('target')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{efficiency.total_actual || 0}</div>
              <div className="stat-label">Total {t('actual')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
