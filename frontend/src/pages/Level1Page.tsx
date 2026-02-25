import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { Issue, ProductionEntry } from '../types/index.js';

export default function Level1Page() {
  const { t } = useTranslation();
  const { workstations, categories, shifts } = useApp();
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [productionData, setProductionData] = useState<ProductionEntry[]>([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Production summary state
  const [prodSummary, setProdSummary] = useState<Record<string, unknown> | null>(null);

  // Production edit state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [showEditProdModal, setShowEditProdModal] = useState(false);
  const [editProdForm, setEditProdForm] = useState({ hour: 0, target: 0, actual: 0, notes: '' });

  // Issue form state
  const [issueForm, setIssueForm] = useState({
    title: '', category_id: '', priority: 'MEDIUM' as const,
    area_text: '', description: '', contact_person: '', subcategory: '',
  });

  // Production form state
  const [prodForm, setProdForm] = useState({ hour: new Date().getHours(), target: 100, actual: 0, notes: '' });

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    if (selectedMachine) {
      loadProductionData();
      loadProductionSummary();
    }
  }, [selectedMachine]);

  const loadIssues = async () => {
    try {
      const res = await api.getIssues({ status: 'OPEN', level: 1, per_page: 50 });
      setIssues(res.data || []);
    } catch { /* ignore */ }
  };

  const loadProductionData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.getProductionEntries({ workstation_id: selectedMachine, date: today });
      setProductionData(res.data || []);
    } catch { /* ignore */ }
  };

  const loadProductionSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.getProductionSummary({ workstation_id: selectedMachine, date: today });
      setProdSummary(res.data || null);
    } catch { /* ignore */ }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createIssue({ ...issueForm, source: 'production' });
      setShowIssueModal(false);
      setIssueForm({ title: '', category_id: '', priority: 'MEDIUM', area_text: '', description: '', contact_person: '', subcategory: '' });
      loadIssues();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSaveProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentShift = shifts.find(s => {
        const hour = new Date().getHours();
        const start = parseInt(s.start_time);
        const end = parseInt(s.end_time);
        if (start < end) return hour >= start && hour < end;
        return hour >= start || hour < end;
      });
      await api.createProductionEntry({
        workstation_id: selectedMachine, shift_id: currentShift?.id || shifts[0]?.id,
        entry_date: today, ...prodForm,
      });
      loadProductionData();
      loadProductionSummary();
      setProdForm(prev => ({ ...prev, actual: 0, notes: '' }));
    } catch { /* ignore */ }
    setLoading(false);
  };

  // --- Production Entry Edit Handlers ---

  const handleEditProductionEntry = (entry: ProductionEntry) => {
    setEditingProdId(entry.id);
    setEditProdForm({
      hour: entry.hour,
      target: entry.target,
      actual: entry.actual,
      notes: entry.notes || '',
    });
    setShowEditProdModal(true);
  };

  const handleUpdateProductionEntry = async () => {
    if (!editingProdId) return;
    setLoading(true);
    try {
      await api.updateProductionEntry(editingProdId, editProdForm);
      setShowEditProdModal(false);
      setEditingProdId(null);
      loadProductionData();
      loadProductionSummary();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const machine = workstations.find(ws => ws.id === selectedMachine);

  // Compute local summary from production data
  const totalTarget = productionData.reduce((sum, e) => sum + e.target, 0);
  const totalActual = productionData.reduce((sum, e) => sum + e.actual, 0);
  const overallEfficiency = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const totalVariance = totalActual - totalTarget;

  if (!selectedMachine) {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('selectWorkstation')}</span>
          </div>
          <p style={{ marginBottom: '1rem' }}>{t('chooseWorkstation')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {workstations.filter(ws => ws.is_active).map(ws => (
              <div key={ws.id} className="card" style={{ cursor: 'pointer', marginBottom: 0 }}
                onClick={() => setSelectedMachine(ws.id)}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{ws.machine_code}</div>
                <div style={{ color: '#666', marginTop: '0.5rem' }}>{ws.name}</div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>{ws.area_name} | {ws.team_name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Machine Info */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('workstation')}: {machine?.machine_code}</span>
          <button className="btn btn-sm" onClick={() => setSelectedMachine('')}>{t('changeWorkstation')}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          <div><strong>{t('machineId')}:</strong> {machine?.machine_code}</div>
          <div><strong>{t('area')}:</strong> {machine?.area_name}</div>
          <div><strong>{t('partNumber')}:</strong> {machine?.default_part || 'N/A'}</div>
        </div>
      </div>

      {/* Production Summary Stats */}
      {productionData.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{productionData.length}</div>
            <div className="stat-label">Entries Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalTarget}</div>
            <div className="stat-label">Total {t('target')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalActual}</div>
            <div className="stat-label">Total {t('actual')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: totalVariance >= 0 ? 'green' : 'red' }}>
              {totalVariance >= 0 ? '+' : ''}{totalVariance}
            </div>
            <div className="stat-label">{t('variance')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: overallEfficiency >= 100 ? 'green' : overallEfficiency >= 80 ? '#ffc107' : 'red' }}>
              {overallEfficiency}%
            </div>
            <div className="stat-label">{t('efficiency')}</div>
          </div>
          {prodSummary && typeof (prodSummary as any).oee === 'number' && (
            <div className="stat-card">
              <div className="stat-value">{(prodSummary as any).oee}%</div>
              <div className="stat-label">OEE</div>
            </div>
          )}
        </div>
      )}

      {/* Production Entry */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('hourlyProduction')}</span>
        </div>
        <form onSubmit={handleSaveProduction}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('hour')}</label>
              <input className="form-input" type="number" min="0" max="23"
                value={prodForm.hour} onChange={e => setProdForm(p => ({ ...p, hour: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('target')}</label>
              <input className="form-input" type="number" min="0"
                value={prodForm.target} onChange={e => setProdForm(p => ({ ...p, target: +e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('actual')}</label>
              <input className="form-input" type="number" min="0"
                value={prodForm.actual} onChange={e => setProdForm(p => ({ ...p, actual: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <input className="form-input" type="text" value={prodForm.notes}
                onChange={e => setProdForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>{t('saveShiftData')}</button>
        </form>

        {productionData.length > 0 && (
          <table className="data-table" style={{ marginTop: '1.5rem' }}>
            <thead>
              <tr>
                <th>{t('hour')}</th><th>{t('target')}</th><th>{t('actual')}</th>
                <th>{t('variance')}</th><th>{t('efficiency')}</th><th>{t('notes')}</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productionData.sort((a, b) => a.hour - b.hour).map(entry => (
                <tr key={entry.id} style={{ cursor: 'pointer' }}
                  onClick={() => handleEditProductionEntry(entry)}>
                  <td>{String(entry.hour).padStart(2, '0')}:00</td>
                  <td>{entry.target}</td><td>{entry.actual}</td>
                  <td style={{ color: entry.actual - entry.target >= 0 ? 'green' : 'red' }}>
                    {entry.actual - entry.target >= 0 ? '+' : ''}{entry.actual - entry.target}
                  </td>
                  <td>{entry.target > 0 ? Math.round((entry.actual / entry.target) * 100) : 0}%</td>
                  <td>{entry.notes}</td>
                  <td>
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleEditProductionEntry(entry); }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Open Issues */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('myOpenIssues')}</span>
          <button className="btn btn-primary" onClick={() => setShowIssueModal(true)}>{t('addNewIssue')}</button>
        </div>
        {issues.length === 0 ? (
          <div className="empty-state">{t('noOpenIssues')}</div>
        ) : (
          <div className="issue-list">
            {issues.map(issue => (
              <div key={issue.id} className="issue-item">
                <div className="issue-header">
                  <span className="issue-title-text">#{issue.issue_number} {issue.title}</span>
                  <span className={`issue-badge ${issue.priority.toLowerCase()}`}>{issue.priority}</span>
                </div>
                <div className="issue-meta">
                  <span>{issue.category_name}</span>
                  <span>{issue.area_text}</span>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
                {issue.description && <div className="issue-description">{issue.description}</div>}
                {issue.ai_suggestion && (
                  <div className="info-box" style={{ marginTop: '0.75rem' }}>
                    <div className="info-box-title">AI Suggestion</div>
                    <div>Suggested Level: {issue.ai_suggestion.suggested_level} ({issue.ai_suggestion.confidence}% confidence)</div>
                    <div>{issue.ai_suggestion.reason}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Issue Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title={t('addNewIssue')}>
        <form onSubmit={handleCreateIssue}>
          <div className="form-group">
            <label className="form-label">{t('issueTitle')}</label>
            <input className="form-input" required value={issueForm.title}
              onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select className="form-select" required value={issueForm.category_id}
                onChange={e => setIssueForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">--</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('priority')}</label>
              <select className="form-select" value={issueForm.priority}
                onChange={e => setIssueForm(f => ({ ...f, priority: e.target.value as any }))}>
                <option value="LOW">{t('low')}</option>
                <option value="MEDIUM">{t('medium')}</option>
                <option value="HIGH">{t('high')}</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('area')}</label>
              <input className="form-input" value={issueForm.area_text}
                onChange={e => setIssueForm(f => ({ ...f, area_text: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('subcategory')}</label>
              <input className="form-input" value={issueForm.subcategory}
                onChange={e => setIssueForm(f => ({ ...f, subcategory: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('description')}</label>
            <textarea className="form-textarea" value={issueForm.description}
              onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('contactPerson')}</label>
            <input className="form-input" value={issueForm.contact_person}
              onChange={e => setIssueForm(f => ({ ...f, contact_person: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{t('save')}</button>
            <button className="btn" type="button" onClick={() => setShowIssueModal(false)}>{t('cancel')}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Production Entry Modal */}
      <Modal isOpen={showEditProdModal} onClose={() => { setShowEditProdModal(false); setEditingProdId(null); }}
        title="Edit Production Entry">
        <div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('hour')}</label>
              <input className="form-input" type="number" min="0" max="23"
                value={editProdForm.hour}
                onChange={e => setEditProdForm(f => ({ ...f, hour: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('target')}</label>
              <input className="form-input" type="number" min="0"
                value={editProdForm.target}
                onChange={e => setEditProdForm(f => ({ ...f, target: +e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('actual')}</label>
              <input className="form-input" type="number" min="0"
                value={editProdForm.actual}
                onChange={e => setEditProdForm(f => ({ ...f, actual: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <input className="form-input" type="text"
                value={editProdForm.notes}
                onChange={e => setEditProdForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleUpdateProductionEntry} disabled={loading}>{t('save')}</button>
            <button className="btn" onClick={() => { setShowEditProdModal(false); setEditingProdId(null); }}>{t('cancel')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
