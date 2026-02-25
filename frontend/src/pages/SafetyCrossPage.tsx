import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { SafetyEntry, SafetyStatus } from '../types/index.js';

const STATUS_COLORS: Record<SafetyStatus, string> = {
  'safe': '#d4edda', 'near-miss': '#fff3cd', 'incident': '#ffdddd', 'not-reported': '#e9ecef',
};

export default function SafetyCrossPage() {
  const { t } = useTranslation();
  const { shifts, teams } = useApp();
  const [entries, setEntries] = useState<SafetyEntry[]>([]);
  const [daysWithout, setDaysWithout] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ shift_id: '', team_id: '', status: 'safe' as SafetyStatus, notes: '' });
  const [loading, setLoading] = useState(false);
  const [currentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`;
      const [entriesRes, daysRes] = await Promise.all([
        api.getSafetyEntries({ from_date: startDate, to_date: endDate }),
        api.getDaysWithoutAccident(),
      ]);
      setEntries(entriesRes.data || []);
      setDaysWithout((daysRes.data as any)?.days || 0);
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createSafetyEntry({
        entry_date: new Date().toISOString().split('T')[0],
        ...form,
      });
      setShowModal(false);
      loadData();
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Build calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getStatusForDay = (day: number): SafetyStatus | null => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEntries = entries.filter(e => e.entry_date === dateStr);
    if (dayEntries.length === 0) return null;
    if (dayEntries.some(e => e.status === 'incident')) return 'incident';
    if (dayEntries.some(e => e.status === 'near-miss')) return 'near-miss';
    return 'safe';
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>{daysWithout}</div>
          <div className="stat-label">{t('daysWithoutAccident')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{entries.filter(e => e.status === 'safe').length}</div>
          <div className="stat-label">{t('safe')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffc107' }}>{entries.filter(e => e.status === 'near-miss').length}</div>
          <div className="stat-label">{t('nearMiss')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc3545' }}>{entries.filter(e => e.status === 'incident').length}</div>
          <div className="stat-label">{t('incident')}</div>
        </div>
      </div>

      {/* Safety Cross Calendar */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('safetyCross')} - {monthNames[currentMonth]} {currentYear}</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t('markSafetyStatus')}</button>
        </div>
        <div className="safety-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="safety-cell header">{d}</div>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="safety-cell" style={{ background: '#fff' }} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const status = getStatusForDay(day);
            return (
              <div key={day} className={`safety-cell ${status || ''}`}
                style={{ background: status ? STATUS_COLORS[status] : '#fff' }}>
                <div style={{ fontWeight: 'bold' }}>{day}</div>
                {status && <div style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{status}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Entries Table */}
      {entries.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Safety Entries</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>{t('shift')}</th><th>{t('status')}</th><th>Team</th><th>{t('notes')}</th></tr>
            </thead>
            <tbody>
              {entries.slice(0, 20).map(entry => (
                <tr key={entry.id}>
                  <td>{entry.entry_date}</td>
                  <td>{entry.shift_name}</td>
                  <td>
                    <span className={`issue-badge`} style={{ background: STATUS_COLORS[entry.status] }}>
                      {entry.status}
                    </span>
                  </td>
                  <td>{entry.team_name}</td>
                  <td>{entry.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Safety Status Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('markSafetyStatus')}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('shift')}</label>
              <select className="form-select" required value={form.shift_id}
                onChange={e => setForm(f => ({ ...f, shift_id: e.target.value }))}>
                <option value="">--</option>
                {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Team</label>
              <select className="form-select" value={form.team_id}
                onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}>
                <option value="">--</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('safetyStatus')}</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {(['safe', 'near-miss', 'incident', 'not-reported'] as SafetyStatus[]).map(status => (
                <button key={status} type="button"
                  className={`btn ${form.status === status ? 'btn-primary' : ''}`}
                  style={{ background: form.status === status ? STATUS_COLORS[status] : undefined,
                    borderColor: form.status === status ? '#000' : undefined }}
                  onClick={() => setForm(f => ({ ...f, status }))}>
                  {t(status === 'near-miss' ? 'nearMiss' : status === 'not-reported' ? 'notReported' : status)}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('notes')}</label>
            <textarea className="form-textarea" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{t('save')}</button>
            <button className="btn" type="button" onClick={() => setShowModal(false)}>{t('cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
