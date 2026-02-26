import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { Issue } from '../types/index.js';

export default function Level3Page() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [resolveIssue, setResolveIssue] = useState<Issue | null>(null);
  const [resolveForm, setResolveForm] = useState({ root_cause: '', corrective_action: '', preventive_action: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesRes, statsRes, dashRes, effRes] = await Promise.all([
        api.getIssues({ level: 3, per_page: 20 }),
        api.getIssueStats(),
        api.getDashboard().catch(() => ({ data: null })),
        api.getProductionEfficiency().catch(() => ({ data: null })),
      ]);
      setIssues(issuesRes.data || []);
      setStats(statsRes.data);
      setDashboard(dashRes.data);
      setEfficiency(effRes.data);
    } catch { /* ignore */ }
  };

  const handleResolve = async () => {
    if (!resolveIssue || !resolveForm.root_cause) return;
    try {
      await api.resolveIssue(resolveIssue.id, resolveForm);
      setResolveIssue(null);
      setResolveForm({ root_cause: '', corrective_action: '', preventive_action: '' });
      loadData();
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
            <div className="stat-value">{Array.isArray(stats.by_status) ? (stats.by_status.find((s: any) => s.status === 'OPEN')?.count ?? 0) : (stats.by_status?.OPEN || 0)}</div>
            <div className="stat-label">{t('open')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Array.isArray(stats.by_status) ? (stats.by_status.find((s: any) => s.status === 'ESCALATED')?.count ?? 0) : (stats.by_status?.ESCALATED || 0)}</div>
            <div className="stat-label">{t('escalated')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Array.isArray(stats.by_status) ? (stats.by_status.find((s: any) => s.status === 'RESOLVED')?.count ?? 0) : (stats.by_status?.RESOLVED || 0)}</div>
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
            {(Array.isArray(stats.by_level) ? stats.by_level : Object.entries(stats.by_level).map(([l, c]) => ({ level: l, count: c }))).map((item: any) => (
              <div key={item.level} className="stat-card">
                <div className="stat-value">{item.count}</div>
                <div className="stat-label">Level {item.level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Efficiency */}
      {efficiency?.overall && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Production Efficiency</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{efficiency.overall.efficiency ? `${Math.round(efficiency.overall.efficiency)}%` : 'N/A'}</div>
              <div className="stat-label">Overall Efficiency</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{efficiency.overall.total_target || 0}</div>
              <div className="stat-label">Total Target</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{efficiency.overall.total_actual || 0}</div>
              <div className="stat-label">Total Actual</div>
            </div>
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
                {issue.status !== 'RESOLVED' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button className="btn btn-small btn-primary" onClick={() => setResolveIssue(issue)}>{t('resolve')}</button>
                  </div>
                )}
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

      {/* Resolve Modal */}
      <Modal isOpen={!!resolveIssue} onClose={() => setResolveIssue(null)} title={`${t('resolve')}: ${resolveIssue?.title || ''}`}>
        <div className="form-group">
          <label className="form-label">{t('rootCause')}</label>
          <textarea className="form-textarea" value={resolveForm.root_cause}
            onChange={e => setResolveForm(f => ({ ...f, root_cause: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('correctiveActions')}</label>
          <textarea className="form-textarea" value={resolveForm.corrective_action}
            onChange={e => setResolveForm(f => ({ ...f, corrective_action: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('preventiveMeasures')}</label>
          <textarea className="form-textarea" value={resolveForm.preventive_action}
            onChange={e => setResolveForm(f => ({ ...f, preventive_action: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleResolve} disabled={!resolveForm.root_cause}>{t('resolve')}</button>
          <button className="btn" onClick={() => setResolveIssue(null)}>{t('cancel')}</button>
        </div>
      </Modal>
    </div>
  );
}
