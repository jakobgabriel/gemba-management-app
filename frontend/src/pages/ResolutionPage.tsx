import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { Issue } from '../types/index.js';

export default function ResolutionPage() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolveForm, setResolveForm] = useState({
    resolution: '', downtime_prevented: 0, defects_reduced: 0, cost_savings: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadIssues(); }, []);

  const loadIssues = async () => {
    try {
      const res = await api.getIssues({ per_page: 50 });
      setIssues((res.data || []).filter((i: Issue) => i.status !== 'RESOLVED'));
    } catch { /* ignore */ }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setLoading(true);
    try {
      await api.resolveIssue(selectedIssue.id, resolveForm);
      setShowResolveModal(false);
      setResolveForm({ resolution: '', downtime_prevented: 0, defects_reduced: 0, cost_savings: 0 });
      loadIssues();
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('issueResolution')}</span>
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
                </div>
                {issue.description && <div className="issue-description">{issue.description}</div>}
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => { setSelectedIssue(issue); setShowResolveModal(true); }}>
                    {t('resolve')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)}
        title={`${t('resolve')} #${selectedIssue?.issue_number}`}>
        <form onSubmit={handleResolve}>
          <div className="info-box" style={{ marginBottom: '1.5rem' }}>
            <strong>{selectedIssue?.title}</strong>
            <div style={{ marginTop: '0.5rem', color: '#666' }}>{selectedIssue?.description}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Resolution / Root Cause</label>
            <textarea className="form-textarea" required value={resolveForm.resolution}
              onChange={e => setResolveForm(f => ({ ...f, resolution: e.target.value }))}
              placeholder="Describe the root cause and corrective actions taken..." />
          </div>
          <div className="card" style={{ background: '#fafafa' }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Impact Assessment</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Downtime Prevented (min)</label>
                <input className="form-input" type="number" min="0" value={resolveForm.downtime_prevented}
                  onChange={e => setResolveForm(f => ({ ...f, downtime_prevented: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Defects Reduced</label>
                <input className="form-input" type="number" min="0" value={resolveForm.defects_reduced}
                  onChange={e => setResolveForm(f => ({ ...f, defects_reduced: +e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cost Savings ($)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={resolveForm.cost_savings}
                onChange={e => setResolveForm(f => ({ ...f, cost_savings: +e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{t('resolve')}</button>
            <button className="btn" type="button" onClick={() => setShowResolveModal(false)}>{t('cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
