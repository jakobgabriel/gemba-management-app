import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { api } from '../api/client.js';
import type { Issue } from '../types/index.js';

export default function Level3Page() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesRes, statsRes, dashRes] = await Promise.all([
        api.getIssues({ level: 3, per_page: 20 }),
        api.getIssueStats(),
        api.getDashboard().catch(() => ({ data: null })),
      ]);
      setIssues(issuesRes.data || []);
      setStats(statsRes.data);
      setDashboard(dashRes.data);
    } catch { /* ignore */ }
  };

  return (
    <div>
      {/* Plant Overview Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Issues</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.by_status?.OPEN || 0}</div>
            <div className="stat-label">{t('open')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.by_status?.ESCALATED || 0}</div>
            <div className="stat-label">{t('escalated')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.by_status?.RESOLVED || 0}</div>
            <div className="stat-label">{t('resolved')}</div>
          </div>
        </div>
      )}

      {/* Level Distribution */}
      {stats?.by_level && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Issues by Level</span>
          </div>
          <div className="stats-grid">
            {Object.entries(stats.by_level as Record<string, number>).map(([level, count]) => (
              <div key={level} className="stat-card">
                <div className="stat-value">{count}</div>
                <div className="stat-label">Level {level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalated to L3 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('issueEscalations')} - Level 3</span>
        </div>
        {issues.length === 0 ? (
          <div className="empty-state">{t('noOpenIssues')}</div>
        ) : (
          <div className="issue-list">
            {issues.map(issue => (
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
                  <span>{issue.area_text}</span>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
                {issue.description && <div className="issue-description">{issue.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {dashboard?.recent_issues && dashboard.recent_issues.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>{t('issueTitle')}</th><th>{t('status')}</th><th>{t('priority')}</th><th>Date</th></tr>
            </thead>
            <tbody>
              {dashboard.recent_issues.slice(0, 10).map((issue: Issue) => (
                <tr key={issue.id}>
                  <td>{issue.issue_number}</td>
                  <td>{issue.title}</td>
                  <td><span className={`issue-badge ${issue.status.toLowerCase()}`}>{issue.status}</span></td>
                  <td><span className={`issue-badge ${issue.priority.toLowerCase()}`}>{issue.priority}</span></td>
                  <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
