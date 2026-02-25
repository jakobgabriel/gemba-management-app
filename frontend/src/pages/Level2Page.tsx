import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { api } from '../api/client.js';
import type { Issue } from '../types/index.js';

export default function Level2Page() {
  const { t } = useTranslation();
  const { workstations } = useApp();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesRes, statsRes] = await Promise.all([
        api.getIssues({ level: 2, per_page: 20 }),
        api.getIssueStats(),
      ]);
      setIssues(issuesRes.data || []);
      setStats(statsRes.data);
    } catch { /* ignore */ }
  };

  return (
    <div>
      {/* Overview Stats */}
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

      {/* Area Issues */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('issueEscalations')} - Level 2</span>
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

      {/* Machine Overview */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('workstation')} {t('overview')}</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('machineId')}</th><th>Name</th><th>{t('area')}</th><th>Team</th><th>{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {workstations.filter(ws => ws.is_active).map(ws => (
              <tr key={ws.id}>
                <td style={{ fontWeight: 'bold' }}>{ws.machine_code}</td>
                <td>{ws.name}</td>
                <td>{ws.area_name}</td>
                <td>{ws.team_name}</td>
                <td><span className="issue-badge" style={{ background: '#d4edda' }}>Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
