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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ shift_id: '', team_id: '', status: 'safe' as SafetyStatus, notes: '' });
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [safetyStats, setSafetyStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { loadData(); }, [currentMonth, currentYear]);

  const loadData = async () => {
    try {
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`;
      const [entriesRes, daysRes, statsRes] = await Promise.all([
        api.getSafetyEntries({ from_date: startDate, to_date: endDate }),
        api.getDaysWithoutAccident(),
        api.getSafetyStatsWithParams({ from_date: startDate, to_date: endDate }),
      ]);
      setEntries(entriesRes.data || []);
      setDaysWithout((daysRes.data as any)?.days || 0);
      setSafetyStats(statsRes.data || null);
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createSafetyEntry({
        entry_date: selectedDate,
        ...form,
      });
      setShowModal(false);
      loadData();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setForm({ shift_id: '', team_id: '', status: 'safe', notes: '' });
    setShowModal(true);
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
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

  // Derive stats from safetyStats response or fall back to local entry counts
  const totalEntries = safetyStats && typeof (safetyStats as any).total_entries === 'number'
    ? (safetyStats as any).total_entries
    : entries.length;

  const byStatus = (safetyStats as any)?.by_status || null;
  const byRiskLevel = (safetyStats as any)?.by_risk_level || null;

  return (
    <div>
      {/* Safety Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>{daysWithout}</div>
          <div className="stat-label">{t('daysWithoutAccident')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalEntries}</div>
          <div className="stat-label">Total Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>
            {byStatus?.safe ?? entries.filter(e => e.status === 'safe').length}
          </div>
          <div className="stat-label">{t('safe')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffc107' }}>
            {byStatus?.['near-miss'] ?? entries.filter(e => e.status === 'near-miss').length}
          </div>
          <div className="stat-label">{t('nearMiss')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc3545' }}>
            {byStatus?.incident ?? entries.filter(e => e.status === 'incident').length}
          </div>
          <div className="stat-label">{t('incident')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#6c757d' }}>
            {byStatus?.['not-reported'] ?? entries.filter(e => e.status === 'not-reported').length}
          </div>
          <div className="stat-label">Not Reported</div>
        </div>
      </div>

      {/* Risk Level Breakdown (from API stats) */}
      {byRiskLevel && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Risk Level Breakdown</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
            {Object.entries(byRiskLevel).map(([level, count]) => (
              <div key={level} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{String(count)}</div>
                <div style={{ color: '#666', fontSize: '0.85rem', textTransform: 'capitalize' }}>{level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Cross Calendar */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-sm" onClick={goToPreviousMonth}>&larr; Prev</button>
            <span className="card-title" style={{ margin: 0 }}>
              {t('safetyCross')} - {monthNames[currentMonth]} {currentYear}
            </span>
            <button className="btn btn-sm" onClick={goToNextMonth}>Next &rarr;</button>
            <button className="btn btn-sm" onClick={goToToday}>Today</button>
          </div>
          <button className="btn btn-primary" onClick={() => {
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setForm({ shift_id: '', team_id: '', status: 'safe', notes: '' });
            setShowModal(true);
          }}>{t('markSafetyStatus')}</button>
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
                style={{
                  background: status ? STATUS_COLORS[status] : '#fff',
                  cursor: 'pointer',
                  border: '1px solid #dee2e6',
                }}
                onClick={() => handleDayClick(day)}
                title={`Click to mark safety status for ${monthNames[currentMonth]} ${day}`}>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${t('markSafetyStatus')} - ${selectedDate}`}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)} />
          </div>
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
