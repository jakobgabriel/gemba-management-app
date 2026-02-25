import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useAuth } from '../store/AuthContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { Issue } from '../types/index.js';

export default function EscalationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [escalationForm, setEscalationForm] = useState({
    reason: '', actions_taken: '', support_needed: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadIssues(); }, []);

  const loadIssues = async () => {
    try {
      const res = await api.getIssues({ status: 'OPEN', per_page: 50 });
      setIssues(res.data || []);
    } catch { /* ignore */ }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setLoading(true);
    try {
      await api.escalateIssue(selectedIssue.id, {
        target_level: selectedIssue.level + 1,
        ...escalationForm,
      });
      setShowEscalateModal(false);
      setEscalationForm({ reason: '', actions_taken: '', support_needed: '' });
      loadIssues();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const openEscalate = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowEscalateModal(true);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('issueEscalations')}</span>
        </div>
        {issues.length === 0 ? (
          <div className="empty-state">{t('noOpenIssues')}</div>
        ) : (
          <div className="issue-list">
            {issues.filter(i => i.status !== 'RESOLVED').map(issue => (
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
                {issue.ai_suggestion && (
                  <div className="info-box" style={{ marginTop: '0.75rem' }}>
                    <div className="info-box-title">{t('aiAssistant')}</div>
                    <div>Suggested: Level {issue.ai_suggestion.suggested_level} ({issue.ai_suggestion.confidence}%)</div>
                    <div>{issue.ai_suggestion.reason}</div>
                  </div>
                )}
                {issue.level < 3 && (user?.role_level || 0) >= issue.level && (
                  <div style={{ marginTop: '1rem' }}>
                    <button className="btn" onClick={() => openEscalate(issue)}>
                      {t('escalate')} to L{issue.level + 1}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showEscalateModal} onClose={() => setShowEscalateModal(false)}
        title={`${t('escalate')} #${selectedIssue?.issue_number}`}>
        <form onSubmit={handleEscalate}>
          <div className="info-box" style={{ marginBottom: '1.5rem' }}>
            <strong>{selectedIssue?.title}</strong>
            <div style={{ marginTop: '0.5rem' }}>
              Escalating from Level {selectedIssue?.level} to Level {(selectedIssue?.level || 0) + 1}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason for Escalation</label>
            <textarea className="form-textarea" required value={escalationForm.reason}
              onChange={e => setEscalationForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Actions Already Taken</label>
            <textarea className="form-textarea" value={escalationForm.actions_taken}
              onChange={e => setEscalationForm(f => ({ ...f, actions_taken: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Support Needed</label>
            <textarea className="form-textarea" value={escalationForm.support_needed}
              onChange={e => setEscalationForm(f => ({ ...f, support_needed: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{t('escalate')}</button>
            <button className="btn" type="button" onClick={() => setShowEscalateModal(false)}>{t('cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
