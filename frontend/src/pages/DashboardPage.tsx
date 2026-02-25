import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { api } from '../api/client.js';
import type { DashboardData } from '../types/index.js';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dashRes, breakRes] = await Promise.all([
        api.getDashboard(),
        api.getIssueBreakdown(),
      ]);
      setDashboard(dashRes.data);
      setBreakdown(breakRes.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      {/* Overview Stats */}
      {dashboard && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{dashboard.total_issues}</div>
            <div className="stat-label">Total Issues</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ffc107' }}>{dashboard.by_status?.OPEN || 0}</div>
            <div className="stat-label">{t('open')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#dc3545' }}>{dashboard.by_status?.ESCALATED || 0}</div>
            <div className="stat-label">{t('escalated')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#28a745' }}>{dashboard.by_status?.RESOLVED || 0}</div>
            <div className="stat-label">{t('resolved')}</div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('category')} Breakdown</span>
        </div>
        {breakdown.length === 0 ? (
          <div className="empty-state">No data available</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>{t('category')}</th><th>Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              {breakdown.map((cat: any) => (
                <tr key={cat.category}>
                  <td style={{ fontWeight: 'bold' }}>{cat.category}</td>
                  <td>{cat.count}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: `${cat.percentage}%`, maxWidth: '200px', height: '20px', background: '#000', minWidth: '2px' }} />
                      {cat.percentage}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Level Distribution */}
      {dashboard?.by_level && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Issues by Level</span>
          </div>
          <div className="stats-grid">
            {Object.entries(dashboard.by_level).map(([level, count]) => (
              <div key={level} className="stat-card">
                <div className="stat-value">{count as number}</div>
                <div className="stat-label">Level {level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Issues */}
      {dashboard?.recent_issues && dashboard.recent_issues.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Issues</span>
          </div>
          <div className="issue-list">
            {dashboard.recent_issues.slice(0, 5).map(issue => (
              <div key={issue.id} className="issue-item">
                <div className="issue-header">
                  <span className="issue-title-text">#{issue.issue_number} {issue.title}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`issue-badge ${issue.status.toLowerCase()}`}>{issue.status}</span>
                    <span className={`issue-badge ${issue.priority.toLowerCase()}`}>{issue.priority}</span>
                  </div>
                </div>
                <div className="issue-meta">
                  <span>L{issue.level}</span>
                  <span>{issue.category_name}</span>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
