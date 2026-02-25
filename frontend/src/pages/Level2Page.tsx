import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { useAuth } from '../store/AuthContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { Issue } from '../types/index.js';

export default function Level2Page() {
  const { t } = useTranslation();
  const { workstations } = useApp();
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [prodSummary, setProdSummary] = useState<any>(null);
  const [escalateIssue, setEscalateIssue] = useState<Issue | null>(null);
  const [resolveIssue, setResolveIssue] = useState<Issue | null>(null);
  const [escalateForm, setEscalateForm] = useState({ reason: '' });
  const [resolveForm, setResolveForm] = useState({ root_cause: '', corrective_action: '', preventive_action: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesRes, statsRes, prodRes] = await Promise.all([
        api.getIssues({ level: 2, per_page: 20 }),
        api.getIssueStats(),
        api.getProductionSummary().catch(() => ({ data: null })),
      ]);
      setIssues(issuesRes.data || []);
      setStats(statsRes.data);
      setProdSummary(prodRes.data);
    } catch { /* ignore */ }
  };

  const handleEscalate = async () => {
    if (!escalateIssue || !escalateForm.reason) return;
    try {
      await api.escalateIssue(escalateIssue.id, { target_level: 3, reason: escalateForm.reason });
      setEscalateIssue(null);
      setEscalateForm({ reason: '' });
      loadData();
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

      {/* Production Summary */}
      {prodSummary && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Production Summary</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{prodSummary.overall?.total_target || 0}</div>
              <div className="stat-label">Total Target</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{prodSummary.overall?.total_actual || 0}</div>
              <div className="stat-label">Total Actual</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{prodSummary.overall?.efficiency ? `${Math.round(prodSummary.overall.efficiency)}%` : 'N/A'}</div>
              <div className="stat-label">Efficiency</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{prodSummary.overall?.total_downtime || 0} min</div>
              <div className="stat-label">Downtime</div>
            </div>
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
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {issue.status !== 'RESOLVED' && issue.level < 3 && (
                    <button className="btn btn-small" onClick={() => setEscalateIssue(issue)}>{t('escalate')}</button>
                  )}
                  {issue.status !== 'RESOLVED' && (
                    <button className="btn btn-small btn-primary" onClick={() => setResolveIssue(issue)}>{t('resolve')}</button>
                  )}
                </div>
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

      {/* Escalate Modal */}
      <Modal isOpen={!!escalateIssue} onClose={() => setEscalateIssue(null)} title={`${t('escalate')}: ${escalateIssue?.title || ''}`}>
        <div className="form-group">
          <label className="form-label">{t('escalationReason')}</label>
          <textarea className="form-textarea" value={escalateForm.reason}
            onChange={e => setEscalateForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="Explain why this issue needs to be escalated..." />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleEscalate} disabled={!escalateForm.reason}>{t('escalate')} to L3</button>
          <button className="btn" onClick={() => setEscalateIssue(null)}>{t('cancel')}</button>
        </div>
      </Modal>

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
