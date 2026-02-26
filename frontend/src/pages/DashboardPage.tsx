import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { api } from '../api/client.js';
import IssueDetailModal from '../components/common/IssueDetailModal.js';
import type { DashboardData, Issue } from '../types/index.js';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dashRes, breakRes] = await Promise.all([
        api.getDashboard(),
        api.getIssueBreakdown(),
      ]);
      setDashboard(dashRes.data);
      const bd = breakRes.data;
      setBreakdown(Array.isArray(bd) ? bd : bd?.breakdown || []);
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
            <div className="stat-value">{dashboard.open_issues ?? (Array.isArray(dashboard.by_status) ? (dashboard.by_status.find((s: any) => s.status === 'OPEN')?.count ?? 0) : (dashboard.by_status?.OPEN || 0))}</div>
            <div className="stat-label">{t('open')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dashboard.escalated_issues ?? (Array.isArray(dashboard.by_status) ? (dashboard.by_status.find((s: any) => s.status === 'ESCALATED')?.count ?? 0) : (dashboard.by_status?.ESCALATED || 0))}</div>
            <div className="stat-label">{t('escalated')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Array.isArray(dashboard.by_status) ? (dashboard.by_status.find((s: any) => s.status === 'RESOLVED')?.count ?? 0) : (dashboard.by_status?.RESOLVED || 0)}</div>
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
            {(Array.isArray(dashboard.by_level) ? dashboard.by_level : Object.entries(dashboard.by_level).map(([l, c]) => ({ level: l, count: c }))).map((item: any) => (
              <div key={item.level} className="stat-card">
                <div className="stat-value">{item.count}</div>
                <div className="stat-label">Level {item.level}</div>
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
              <div
                key={issue.id}
                className="issue-item"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedIssue(issue)}
              >
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
      {/* Issue Detail Modal (read-only) */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          readOnly
        />
      )}
    </div>
  );
}
