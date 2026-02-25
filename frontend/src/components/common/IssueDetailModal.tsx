// ============================================================================
// Gemba Management System - Issue Detail Modal Component
// ============================================================================

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../../api/client.js';
import { useTranslation } from '../../i18n/index.js';
import type { Issue, Priority, IssueStatus, IssueSource } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
  onUpdate?: (issue: Issue) => void;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// History entry shape (matches API client return type)
// ---------------------------------------------------------------------------

interface HistoryEntry {
  action: string;
  timestamp: string;
  user: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  onUpdate,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [areaText, setAreaText] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<IssueStatus>('OPEN');
  const [source, setSource] = useState<IssueSource>('production');
  const [contactPerson, setContactPerson] = useState('');

  // Escalation history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sync form fields when issue changes
  useEffect(() => {
    if (issue) {
      setTitle(issue.title || '');
      setDescription(issue.description || '');
      setCategory(issue.category_name || '');
      setAreaText(issue.area_text || '');
      setPriority(issue.priority);
      setLevel(issue.level);
      setStatus(issue.status);
      setSource(issue.source);
      setContactPerson(issue.contact_person || '');
      setEditing(false);
      setError('');
      loadHistory(issue.id);
    }
  }, [issue]);

  const loadHistory = async (issueId: string) => {
    setLoadingHistory(true);
    try {
      const res = await api.getIssueHistory(issueId);
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    }
    setLoadingHistory(false);
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
  };

  const handleCancel = () => {
    if (issue) {
      setTitle(issue.title || '');
      setDescription(issue.description || '');
      setCategory(issue.category_name || '');
      setAreaText(issue.area_text || '');
      setPriority(issue.priority);
      setLevel(issue.level);
      setStatus(issue.status);
      setSource(issue.source);
      setContactPerson(issue.contact_person || '');
    }
    setEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (!issue) return;
    setSaving(true);
    setError('');
    try {
      const updatedFields: Partial<Issue> = {
        title,
        description,
        category_name: category,
        area_text: areaText,
        priority,
        level,
        status,
        source,
        contact_person: contactPerson,
      };
      const res = await api.updateIssue(issue.id, updatedFields);
      setEditing(false);
      if (onUpdate) {
        onUpdate(res.data);
      }
    } catch {
      setError('Failed to save changes. Please try again.');
    }
    setSaving(false);
  };

  if (!issue) return null;

  return (
    <Modal
      isOpen={!!issue}
      onClose={onClose}
      title={`#${issue.issue_number} ${issue.title}`}
    >
      <div className="issue-detail-modal">
        {error && (
          <div style={{ color: '#dc3545', marginBottom: '1rem', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {/* Action buttons */}
        {!readOnly && !editing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn" onClick={handleEdit} type="button">
              {t('edit')}
            </button>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Title */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              {t('issueTitle')}
            </label>
            {editing ? (
              <input
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%' }}
              />
            ) : (
              <div>{issue.title}</div>
            )}
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              {t('description')}
            </label>
            {editing ? (
              <textarea
                className="form-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ width: '100%' }}
              />
            ) : (
              <div>{issue.description || '-'}</div>
            )}
          </div>

          {/* Category */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              {t('category')}
            </label>
            {editing ? (
              <input
                className="form-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%' }}
              />
            ) : (
              <div>{issue.category_name || '-'}</div>
            )}
          </div>

          {/* Area */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              {t('area')}
            </label>
            {editing ? (
              <input
                className="form-input"
                value={areaText}
                onChange={e => setAreaText(e.target.value)}
                style={{ width: '100%' }}
              />
            ) : (
              <div>{issue.area_text || '-'}</div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              {t('priority')}
            </label>
            {editing ? (
              <select
                className="form-select"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                <option value="LOW">{t('low')}</option>
                <option value="MEDIUM">{t('medium')}</option>
                <option value="HIGH">{t('high')}</option>
              </select>
            ) : (
              <span className={`issue-badge ${issue.priority.toLowerCase()}`}>
                {issue.priority}
              </span>
            )}
          </div>

          {/* Level */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              Level
            </label>
            {editing ? (
              <select
                className="form-select"
                value={level}
                onChange={e => setLevel(Number(e.target.value))}
              >
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
              </select>
            ) : (
              <div>L{issue.level}</div>
            )}
          </div>

          {/* Status */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              {t('status')}
            </label>
            {editing ? (
              <select
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value as IssueStatus)}
              >
                <option value="OPEN">{t('open')}</option>
                <option value="ESCALATED">{t('escalated')}</option>
                <option value="RESOLVED">{t('resolved')}</option>
              </select>
            ) : (
              <span className={`issue-badge ${issue.status.toLowerCase()}`}>
                {issue.status}
              </span>
            )}
          </div>

          {/* Source */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              Source
            </label>
            {editing ? (
              <select
                className="form-select"
                value={source}
                onChange={e => setSource(e.target.value as IssueSource)}
              >
                <option value="production">Production</option>
                <option value="gemba">Gemba</option>
              </select>
            ) : (
              <div>{issue.source}</div>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              {t('contactPerson')}
            </label>
            {editing ? (
              <input
                className="form-input"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                style={{ width: '100%' }}
              />
            ) : (
              <div>{issue.contact_person || '-'}</div>
            )}
          </div>

          {/* Created Date */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              Created
            </label>
            <div>{new Date(issue.created_at).toLocaleString()}</div>
          </div>

          {/* Updated Date */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              Updated
            </label>
            <div>{new Date(issue.updated_at).toLocaleString()}</div>
          </div>

          {/* Created By */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
              Created By
            </label>
            <div>{issue.creator_name || issue.created_by || '-'}</div>
          </div>
        </div>

        {/* AI Suggestion */}
        {issue.ai_suggestion && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', border: '2px solid #000' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
              AI Suggestion
            </label>
            <div>Suggested Level: {issue.ai_suggestion.suggested_level}</div>
            <div>Reason: {issue.ai_suggestion.reason}</div>
            <div>Confidence: {Math.round(issue.ai_suggestion.confidence * 100)}%</div>
          </div>
        )}

        {/* Resolution */}
        {issue.resolution && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', border: '2px solid #000' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
              Resolution
            </label>
            <div>{issue.resolution.resolution}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#555' }}>
              Resolved by: {issue.resolution.resolved_by} on{' '}
              {new Date(issue.resolution.resolved_at).toLocaleString()}
            </div>
            {(issue.resolution.downtime_prevented > 0 ||
              issue.resolution.defects_reduced > 0 ||
              issue.resolution.cost_savings > 0) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                {issue.resolution.downtime_prevented > 0 && (
                  <span>Downtime prevented: {issue.resolution.downtime_prevented}min</span>
                )}
                {issue.resolution.defects_reduced > 0 && (
                  <span>Defects reduced: {issue.resolution.defects_reduced}</span>
                )}
                {issue.resolution.cost_savings > 0 && (
                  <span>Cost savings: ${issue.resolution.cost_savings}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Escalation History */}
        <div style={{ marginTop: '1.5rem' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
            Escalation History
          </label>
          {loadingHistory ? (
            <div>Loading history...</div>
          ) : history.length === 0 ? (
            <div style={{ color: '#888' }}>No history entries</div>
          ) : (
            <div style={{ border: '2px solid #000' }}>
              {history.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    borderBottom: idx < history.length - 1 ? '1px solid #ddd' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{entry.action}</div>
                    {entry.details && (
                      <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                        {entry.details}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#555', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div>{entry.user}</div>
                    <div>{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit mode action buttons */}
        {editing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn"
              onClick={handleCancel}
              type="button"
              disabled={saving}
            >
              {t('cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              type="button"
              disabled={saving}
            >
              {saving ? 'Saving...' : t('save')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default IssueDetailModal;
