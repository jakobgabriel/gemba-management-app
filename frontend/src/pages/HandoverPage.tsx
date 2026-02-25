import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { api } from '../api/client.js';
import type { HandoverNote } from '../types/index.js';

export default function HandoverPage() {
  const { t } = useTranslation();
  const { shifts } = useApp();
  const [notes, setNotes] = useState<HandoverNote[]>([]);
  const [currentNotes, setCurrentNotes] = useState<HandoverNote[]>([]);
  const [content, setContent] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const [allRes, currentRes] = await Promise.all([
        api.getHandoverNotes({ per_page: 20 }),
        api.getCurrentHandoverNotes(),
      ]);
      setNotes(allRes.data || []);
      setCurrentNotes(currentRes.data || []);
    } catch { /* ignore */ }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !shiftId) return;
    setLoading(true);
    try {
      await api.createHandoverNote({
        shift_id: shiftId,
        note_date: new Date().toISOString().split('T')[0],
        content,
      });
      setContent('');
      loadNotes();
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div>
      {/* Previous Shift Notes */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('previousShift')}</span>
        </div>
        {currentNotes.length === 0 ? (
          <div className="empty-state">{t('noHandoverNotes')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentNotes.map(note => (
              <div key={note.id} className="info-box">
                <div className="info-box-title">{note.shift_name} - {note.note_date}</div>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{note.content}</div>
                <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  By {note.creator_name} at {new Date(note.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Handover Note */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('currentShiftHandover')}</span>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">{t('shift')}</label>
            <select className="form-select" required value={shiftId}
              onChange={e => setShiftId(e.target.value)}>
              <option value="">--</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('notes')}</label>
            <textarea className="form-textarea" style={{ minHeight: '200px' }}
              value={content} onChange={e => setContent(e.target.value)}
              placeholder="Enter handover notes for the next shift..." required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {t('saveHandoverNotes')}
          </button>
        </form>
      </div>

      {/* History */}
      {notes.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Handover History</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>{t('shift')}</th><th>{t('notes')}</th><th>By</th></tr>
            </thead>
            <tbody>
              {notes.map(note => (
                <tr key={note.id}>
                  <td>{note.note_date}</td>
                  <td>{note.shift_name}</td>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.content}
                  </td>
                  <td>{note.creator_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
