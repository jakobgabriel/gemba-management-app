import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { GembaWalk } from '../types/index.js';

const STEPS = ['Initiation', 'Observation', 'Documentation', 'Issues', 'Report'];

const CHECKLIST_ITEMS = [
  'Equipment condition and maintenance status',
  'Safety signage and PPE compliance',
  '5S workplace organization',
  'Production flow and bottlenecks',
  'Quality control checkpoints',
  'Material handling and storage',
  'Team communication boards updated',
  'Standard work procedures followed',
];

export default function GembaWalkPage() {
  const { t } = useTranslation();
  const { categories } = useApp();
  const [walks, setWalks] = useState<GembaWalk[]>([]);
  const [activeWalk, setActiveWalk] = useState<GembaWalk | null>(null);
  const [step, setStep] = useState(1);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Walk form data
  const [walkForm, setWalkForm] = useState({ target_areas: '', focus: '', participants: '' });
  const [findings, setFindings] = useState('');
  const [teamFeedback, setTeamFeedback] = useState('');
  const [walkIssues, setWalkIssues] = useState<any[]>([]);
  const [issueForm, setIssueForm] = useState({ title: '', priority: 'MEDIUM', area_text: '', description: '', category_id: '' });
  const [detailWalk, setDetailWalk] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { loadWalks(); }, []);

  const loadWalks = async () => {
    try {
      const res = await api.getGembaWalks({ per_page: 20 });
      setWalks(res.data || []);
      const inProgress = (res.data || []).find((w: GembaWalk) => w.status === 'in_progress');
      if (inProgress) {
        setActiveWalk(inProgress);
        setStep(inProgress.current_step);
      }
    } catch { /* ignore */ }
  };

  const startWalk = async () => {
    if (!walkForm.target_areas || !walkForm.focus) return;
    setLoading(true);
    try {
      const res = await api.createGembaWalk(walkForm);
      setActiveWalk(res.data);
      setStep(1);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const nextStep = async () => {
    if (!activeWalk) return;
    const newStep = Math.min(step + 1, 5);
    try {
      if (step === 3 && findings) {
        await api.addGembaWalkFinding(activeWalk.id, { observation: findings, finding_type: 'observation' });
      }
      await api.updateGembaWalk(activeWalk.id, { current_step: newStep, team_feedback: teamFeedback || undefined });
      setStep(newStep);
    } catch { /* ignore */ }
  };

  const prevStep = () => setStep(Math.max(step - 1, 1));

  const completeWalk = async () => {
    if (!activeWalk) return;
    setLoading(true);
    try {
      // Create any issues captured during the walk
      for (const issue of walkIssues) {
        await api.createGembaWalkIssue(activeWalk.id, issue);
      }
      await api.completeGembaWalk(activeWalk.id);
      setActiveWalk(null);
      setStep(1);
      setWalkForm({ target_areas: '', focus: '', participants: '' });
      setFindings('');
      setTeamFeedback('');
      setWalkIssues([]);
      setCheckedItems(new Set());
      loadWalks();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const addIssue = () => {
    if (!issueForm.title) return;
    setWalkIssues(prev => [...prev, { ...issueForm, source: 'gemba' }]);
    setIssueForm({ title: '', priority: 'MEDIUM', area_text: '', description: '', category_id: '' });
    setShowIssueModal(false);
  };

  const viewWalkDetail = async (walkId: string) => {
    try {
      const res = await api.getGembaWalk(walkId);
      setDetailWalk(res.data);
      setShowDetailModal(true);
    } catch { /* ignore */ }
  };

  const toggleChecklist = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // Active walk view
  if (activeWalk) {
    return (
      <div>
        {/* Progress Steps */}
        <div className="progress-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`progress-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}>
              {i + 1}. {t(s.toLowerCase() as any) || s}
            </div>
          ))}
        </div>

        <div className="card">
          {/* Step 1: Initiation */}
          {step === 1 && (
            <div>
              <div className="card-title" style={{ marginBottom: '1.5rem' }}>{t('initiation')}</div>
              <div className="form-group">
                <label className="form-label">{t('targetAreas')}</label>
                <input className="form-input" value={walkForm.target_areas}
                  onChange={e => setWalkForm(f => ({ ...f, target_areas: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('focus')}</label>
                <textarea className="form-textarea" value={walkForm.focus}
                  onChange={e => setWalkForm(f => ({ ...f, focus: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('participants')}</label>
                <input className="form-input" value={walkForm.participants}
                  onChange={e => setWalkForm(f => ({ ...f, participants: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Step 2: Observation */}
          {step === 2 && (
            <div>
              <div className="card-title" style={{ marginBottom: '1.5rem' }}>{t('observation')}</div>
              <p style={{ marginBottom: '1rem' }}>Check items as you observe them during the walk:</p>
              {CHECKLIST_ITEMS.map((item, i) => (
                <div key={i} className={`checklist-item ${checkedItems.has(i) ? 'checked' : ''}`}
                  onClick={() => toggleChecklist(i)}>
                  <input type="checkbox" checked={checkedItems.has(i)} readOnly
                    style={{ width: '20px', height: '20px' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Documentation */}
          {step === 3 && (
            <div>
              <div className="card-title" style={{ marginBottom: '1.5rem' }}>{t('documentation')}</div>
              <div className="form-group">
                <label className="form-label">{t('observationsFindings')}</label>
                <textarea className="form-textarea" style={{ minHeight: '200px' }}
                  value={findings} onChange={e => setFindings(e.target.value)}
                  placeholder="Document your observations and findings..." />
              </div>
              <div className="form-group">
                <label className="form-label">{t('teamFeedback')}</label>
                <textarea className="form-textarea" value={teamFeedback}
                  onChange={e => setTeamFeedback(e.target.value)}
                  placeholder="Feedback received from team members..." />
              </div>
            </div>
          )}

          {/* Step 4: Issues */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span className="card-title">{t('issues')}</span>
                <button className="btn" onClick={() => setShowIssueModal(true)}>{t('addNewIssue')}</button>
              </div>
              {walkIssues.length === 0 ? (
                <div className="empty-state">No issues captured yet. Add issues found during the walk.</div>
              ) : (
                <div className="issue-list">
                  {walkIssues.map((issue, i) => (
                    <div key={i} className="issue-item">
                      <div className="issue-header">
                        <span className="issue-title-text">{issue.title}</span>
                        <span className={`issue-badge ${issue.priority.toLowerCase()}`}>{issue.priority}</span>
                      </div>
                      {issue.description && <div className="issue-description">{issue.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Report */}
          {step === 5 && (
            <div>
              <div className="card-title" style={{ marginBottom: '1.5rem' }}>{t('report')}</div>
              <div className="info-box">
                <div className="info-box-title">Walk Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div><strong>{t('targetAreas')}:</strong> {walkForm.target_areas || activeWalk.target_areas}</div>
                  <div><strong>{t('focus')}:</strong> {walkForm.focus || activeWalk.focus}</div>
                  <div><strong>{t('participants')}:</strong> {walkForm.participants || activeWalk.participants}</div>
                  <div><strong>Issues Found:</strong> {walkIssues.length}</div>
                  <div><strong>Checklist Items:</strong> {checkedItems.size}/{CHECKLIST_ITEMS.length}</div>
                </div>
              </div>
              {findings && (
                <div className="info-box" style={{ marginTop: '1rem' }}>
                  <div className="info-box-title">{t('observationsFindings')}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{findings}</div>
                </div>
              )}
              {teamFeedback && (
                <div className="info-box" style={{ marginTop: '1rem' }}>
                  <div className="info-box-title">{t('teamFeedback')}</div>
                  <div>{teamFeedback}</div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button className="btn" onClick={prevStep} disabled={step <= 1}>Previous</button>
            {step < 5 ? (
              <button className="btn btn-primary" onClick={nextStep}>Next</button>
            ) : (
              <button className="btn btn-primary" onClick={completeWalk} disabled={loading}>Complete Walk</button>
            )}
          </div>
        </div>

        {/* Issue Modal */}
        <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title={t('addNewIssue')}>
          <div className="form-group">
            <label className="form-label">{t('issueTitle')}</label>
            <input className="form-input" value={issueForm.title}
              onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('priority')}</label>
              <select className="form-select" value={issueForm.priority}
                onChange={e => setIssueForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="LOW">{t('low')}</option>
                <option value="MEDIUM">{t('medium')}</option>
                <option value="HIGH">{t('high')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select className="form-select" value={issueForm.category_id}
                onChange={e => setIssueForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">--</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('area')}</label>
            <input className="form-input" value={issueForm.area_text}
              onChange={e => setIssueForm(f => ({ ...f, area_text: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('description')}</label>
            <textarea className="form-textarea" value={issueForm.description}
              onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={addIssue}>{t('add')}</button>
            <button className="btn" onClick={() => setShowIssueModal(false)}>{t('cancel')}</button>
          </div>
        </Modal>
      </div>
    );
  }

  // Walk list / start view
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('gembaWalkProcess')}</span>
        </div>
        <div className="form-group">
          <label className="form-label">{t('targetAreas')}</label>
          <input className="form-input" value={walkForm.target_areas}
            onChange={e => setWalkForm(f => ({ ...f, target_areas: e.target.value }))}
            placeholder="e.g., Production Area A, Packaging" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('focus')}</label>
          <input className="form-input" value={walkForm.focus}
            onChange={e => setWalkForm(f => ({ ...f, focus: e.target.value }))}
            placeholder="e.g., Safety compliance, 5S audit" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('participants')}</label>
          <input className="form-input" value={walkForm.participants}
            onChange={e => setWalkForm(f => ({ ...f, participants: e.target.value }))}
            placeholder="e.g., Area Leader, Team Lead A" />
        </div>
        <button className="btn btn-primary" onClick={startWalk} disabled={loading || !walkForm.target_areas || !walkForm.focus}>
          Start {t('gembaWalk')}
        </button>
      </div>

      {/* Walk History */}
      {walks.filter(w => w.status === 'completed').length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('gembaWalk')} History</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Leader</th><th>{t('area')}</th><th>Duration</th><th>Issues</th><th>{t('status')}</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {walks.filter(w => w.status === 'completed').map(walk => (
                <tr key={walk.id}>
                  <td>{new Date(walk.started_at).toLocaleDateString()}</td>
                  <td>{walk.leader_name}</td>
                  <td>{walk.target_areas}</td>
                  <td>{walk.duration_min} min</td>
                  <td>{walk.issues_count || 0}</td>
                  <td><span className="issue-badge resolved">{walk.status}</span></td>
                  <td>
                    <button className="btn btn-small" onClick={() => viewWalkDetail(walk.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Walk Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Gemba Walk Details">
        {detailWalk && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div><strong>Title:</strong> {detailWalk.title}</div>
              <div><strong>Status:</strong> <span className={`issue-badge ${detailWalk.status}`}>{detailWalk.status}</span></div>
              <div><strong>Target Areas:</strong> {detailWalk.target_areas}</div>
              <div><strong>Focus:</strong> {detailWalk.focus}</div>
              <div><strong>Participants:</strong> {detailWalk.participants}</div>
              <div><strong>Duration:</strong> {detailWalk.duration_min} min</div>
              <div><strong>Started:</strong> {new Date(detailWalk.started_at).toLocaleString()}</div>
              {detailWalk.completed_at && <div><strong>Completed:</strong> {new Date(detailWalk.completed_at).toLocaleString()}</div>}
            </div>
            {detailWalk.team_feedback && (
              <div className="info-box" style={{ marginBottom: '1rem' }}>
                <div className="info-box-title">Team Feedback</div>
                <div>{detailWalk.team_feedback}</div>
              </div>
            )}
            {detailWalk.findings && detailWalk.findings.length > 0 && (
              <div className="info-box" style={{ marginBottom: '1rem' }}>
                <div className="info-box-title">Findings ({detailWalk.findings.length})</div>
                {detailWalk.findings.map((f: any, i: number) => (
                  <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{f.finding_type}</strong>
                      {f.severity && <span className={`issue-badge ${f.severity.toLowerCase()}`}>{f.severity}</span>}
                    </div>
                    <div>{f.observation}</div>
                  </div>
                ))}
              </div>
            )}
            {detailWalk.issues && detailWalk.issues.length > 0 && (
              <div className="info-box">
                <div className="info-box-title">Issues Created ({detailWalk.issues.length})</div>
                {detailWalk.issues.map((issue: any) => (
                  <div key={issue.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{issue.title}</strong>
                      <span className={`issue-badge ${issue.priority?.toLowerCase()}`}>{issue.priority}</span>
                    </div>
                    {issue.description && <div style={{ fontSize: '0.9em', color: '#666' }}>{issue.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
