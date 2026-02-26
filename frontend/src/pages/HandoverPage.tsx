import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { useAuth } from '../store/AuthContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { HandoverNote } from '../types/index.js';

export default function HandoverPage() {
  const { t } = useTranslation();
  const { shifts } = useApp();
  const { user } = useAuth();
  const [notes, setNotes] = useState<HandoverNote[]>([]);
  const [currentNotes, setCurrentNotes] = useState<HandoverNote[]>([]);
  const [content, setContent] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingNote, setEditingNote] = useState<HandoverNote | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editShiftId, setEditShiftId] = useState('');

  // User role level: team_member=1, area_leader=2, plant_manager=3, admin=4
  const roleLevel = user?.role_level ?? (
    user?.role === 'admin' ? 4 :
    user?.role === 'plant_manager' ? 3 :
    user?.role === 'area_leader' ? 2 : 1
  );
  const canDelete = roleLevel >= 2;

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const [allRes, currentRes] = await Promise.all([
        api.getHandoverNotes({ per_page: 20 }),
        api.getCurrentHandoverNotes(),
      ]);
      setNotes(allRes.data || []);
      const curData = currentRes.data;
      setCurrentNotes(Array.isArray(curData) ? curData : curData?.notes || []);
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

  // --- Edit handlers ---

  const openEditModal = (note: HandoverNote) => {
    setEditingNote(note);
    setEditContent(note.content);
    setEditShiftId(note.shift_id);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingNote || !editContent) return;
    setLoading(true);
    try {
      await api.updateHandoverNote(editingNote.id, {
        content: editContent,
        shift_id: editShiftId,
      });
      setShowEditModal(false);
      setEditingNote(null);
      loadNotes();
    } catch { /* ignore */ }
    setLoading(false);
  };

  // --- Delete handler ---

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this handover note?')) return;
    try {
      await api.deleteHandoverNote(id);
      loadNotes();
    } catch { /* ignore */ }
  };

  const isOwnNote = (note: HandoverNote) => {
    return user && note.created_by === user.id;
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="info-box-title">{note.shift_name} - {note.note_date}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isOwnNote(note) && (
                      <button className="btn btn-sm" onClick={() => openEditModal(note)}>
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(note.id)}>
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>
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
              <tr><th>Date</th><th>{t('shift')}</th><th>{t('notes')}</th><th>By</th><th>Actions</th></tr>
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
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isOwnNote(note) && (
                        <button className="btn btn-sm" onClick={() => openEditModal(note)}>
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(note.id)}>
                          {t('delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Handover Note Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingNote(null); }}
        title="Edit Handover Note">
        <div>
          <div className="form-group">
            <label className="form-label">{t('shift')}</label>
            <select className="form-select" value={editShiftId}
              onChange={e => setEditShiftId(e.target.value)}>
              <option value="">--</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('notes')}</label>
            <textarea className="form-textarea" style={{ minHeight: '200px' }}
              value={editContent} onChange={e => setEditContent(e.target.value)}
              placeholder="Edit handover notes..." />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>{t('save')}</button>
            <button className="btn" onClick={() => { setShowEditModal(false); setEditingNote(null); }}>{t('cancel')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
