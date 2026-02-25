import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { useAuth } from '../store/AuthContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';
import type { User, Shift } from '../types/index.js';

type Tab = 'workstations' | 'categories' | 'areas' | 'teams' | 'operators' | 'shifts' | 'users';

export default function AdminConfigPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { workstations, categories, areas, teams, shifts, operators, reloadConfig } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('workstations');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms
  const [wsForm, setWsForm] = useState({ machine_code: '', name: '', area_id: '', team_id: '', default_part: '' });
  const [nameForm, setNameForm] = useState('');

  // Shift form
  const [shiftForm, setShiftForm] = useState({ name: '', start_time: '', end_time: '' });

  // Users tab state
  const [users, setUsers] = useState<User[]>([]);
  const [userForm, setUserForm] = useState({ username: '', email: '', display_name: '', role: 'team_member' as string, preferred_lang: 'en' });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      loadUsers();
    }
  }, [activeTab, isAdmin]);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch { /* ignore */ }
  };

  // ---- Workstation handlers ----

  const resetWsForm = () => setWsForm({ machine_code: '', name: '', area_id: '', team_id: '', default_part: '' });

  const handleAddWorkstation = async () => {
    setLoading(true);
    try {
      await api.createWorkstation(wsForm);
      resetWsForm();
      setShowModal(false);
      reloadConfig();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleEditWorkstation = (ws: any) => {
    setEditingId(ws.id);
    setWsForm({
      machine_code: ws.machine_code || '',
      name: ws.name || '',
      area_id: ws.area_id || '',
      team_id: ws.team_id || '',
      default_part: ws.default_part || '',
    });
    setShowModal(true);
  };

  const handleUpdateWorkstation = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      await api.updateWorkstation(editingId, wsForm);
      resetWsForm();
      setEditingId(null);
      setShowModal(false);
      reloadConfig();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeleteWorkstation = async (id: string) => {
    if (!confirm('Delete this workstation?')) return;
    try { await api.deleteWorkstation(id); reloadConfig(); } catch { /* ignore */ }
  };

  // ---- Simple item handlers (categories, areas, teams, operators) ----

  const handleAddSimple = async () => {
    if (!nameForm) return;
    setLoading(true);
    try {
      if (activeTab === 'categories') await api.createCategory({ name: nameForm });
      else if (activeTab === 'areas') await api.createArea({ name: nameForm });
      else if (activeTab === 'teams') await api.createTeam({ name: nameForm });
      else if (activeTab === 'operators') await api.createOperator({ name: nameForm });
      setNameForm('');
      setEditingId(null);
      setShowModal(false);
      reloadConfig();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleEditSimple = (item: any) => {
    setEditingId(item.id);
    setNameForm(item.name || '');
    setShowModal(true);
  };

  const handleUpdateSimple = async () => {
    if (!editingId || !nameForm) return;
    setLoading(true);
    try {
      if (activeTab === 'categories') await api.updateCategory(editingId, { name: nameForm });
      else if (activeTab === 'areas') await api.updateArea(editingId, { name: nameForm });
      else if (activeTab === 'teams') await api.updateTeam(editingId, { name: nameForm });
      else if (activeTab === 'operators') await api.updateOperator(editingId, { name: nameForm });
      setNameForm('');
      setEditingId(null);
      setShowModal(false);
      reloadConfig();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeleteSimple = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      if (activeTab === 'categories') await api.deleteCategory(id);
      else if (activeTab === 'areas') await api.deleteArea(id);
      else if (activeTab === 'teams') await api.deleteTeam(id);
      else if (activeTab === 'operators') await api.deleteOperator(id);
      reloadConfig();
    } catch { /* ignore */ }
  };

  // ---- Shift handlers ----

  const resetShiftForm = () => setShiftForm({ name: '', start_time: '', end_time: '' });

  const handleAddShift = async () => {
    if (!shiftForm.name) return;
    setLoading(true);
    try {
      await api.createShift(shiftForm);
      resetShiftForm();
      setEditingId(null);
      setShowModal(false);
      reloadConfig();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingId(shift.id);
    setShiftForm({ name: shift.name, start_time: shift.start_time, end_time: shift.end_time });
    setShowModal(true);
  };

  const handleUpdateShift = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      await api.updateShift(editingId, shiftForm);
      resetShiftForm();
      setEditingId(null);
      setShowModal(false);
      reloadConfig();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Delete this shift?')) return;
    try { await api.deleteShift(id); reloadConfig(); } catch { /* ignore */ }
  };

  // ---- User handlers ----

  const resetUserForm = () => setUserForm({ username: '', email: '', display_name: '', role: 'team_member', preferred_lang: 'en' });

  const handleAddUser = async () => {
    if (!userForm.username) return;
    setLoading(true);
    try {
      await api.createUser(userForm);
      resetUserForm();
      setEditingId(null);
      setShowModal(false);
      loadUsers();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleEditUser = (u: User) => {
    setEditingId(u.id);
    setUserForm({
      username: u.username,
      email: u.email || '',
      display_name: u.display_name || '',
      role: u.role,
      preferred_lang: u.preferred_lang || 'en',
    });
    setShowModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      await api.updateUser(editingId, userForm);
      resetUserForm();
      setEditingId(null);
      setShowModal(false);
      loadUsers();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try { await api.deleteUser(id); loadUsers(); } catch { /* ignore */ }
  };

  // ---- Open modal for add (reset editing state) ----

  const openAddModal = () => {
    setEditingId(null);
    if (activeTab === 'workstations') resetWsForm();
    else if (activeTab === 'shifts') resetShiftForm();
    else if (activeTab === 'users') resetUserForm();
    else setNameForm('');
    setShowModal(true);
  };

  // ---- Modal save handler ----

  const handleModalSave = () => {
    if (activeTab === 'workstations') {
      return editingId ? handleUpdateWorkstation() : handleAddWorkstation();
    }
    if (activeTab === 'shifts') {
      return editingId ? handleUpdateShift() : handleAddShift();
    }
    if (activeTab === 'users') {
      return editingId ? handleUpdateUser() : handleAddUser();
    }
    // Simple items
    return editingId ? handleUpdateSimple() : handleAddSimple();
  };

  const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: 'workstations', label: t('workstation') + 's' },
    { key: 'categories', label: t('category') + 's' },
    { key: 'areas', label: t('area') + 's' },
    { key: 'teams', label: 'Teams' },
    { key: 'operators', label: t('operator') + 's' },
    { key: 'shifts', label: 'Shifts' },
    { key: 'users', label: 'Users', adminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  const modalTitle = editingId
    ? `Edit ${tabs.find(t => t.key === activeTab)?.label?.replace(/s$/, '') || ''}`
    : `${t('add')} ${tabs.find(t => t.key === activeTab)?.label}`;

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {visibleTabs.map(tab => (
          <button key={tab.key}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : ''}`}
            style={{ borderRadius: 0 }}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workstations Tab */}
      {activeTab === 'workstations' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('workstation')}s</span>
            <button className="btn btn-primary" onClick={openAddModal}>{t('add')}</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>{t('machineId')}</th><th>Name</th><th>{t('area')}</th><th>Team</th><th>Part</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {workstations.map(ws => (
                <tr key={ws.id}>
                  <td style={{ fontWeight: 'bold' }}>{ws.machine_code}</td>
                  <td>{ws.name}</td>
                  <td>{ws.area_name}</td>
                  <td>{ws.team_name}</td>
                  <td>{ws.default_part}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm" onClick={() => handleEditWorkstation(ws)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteWorkstation(ws.id)}>
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple list tabs (categories, areas, teams, operators) */}
      {(activeTab === 'categories' || activeTab === 'areas' || activeTab === 'teams' || activeTab === 'operators') && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{tabs.find(t => t.key === activeTab)?.label}</span>
            <button className="btn btn-primary" onClick={openAddModal}>{t('add')}</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(activeTab === 'categories' ? categories :
                activeTab === 'areas' ? areas :
                activeTab === 'teams' ? teams :
                operators).map((item: any) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm" onClick={() => handleEditSimple(item)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSimple(item.id)}>
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Shifts</span>
            <button className="btn btn-primary" onClick={openAddModal}>{t('add')}</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Start Time</th><th>End Time</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {shifts.map(shift => (
                <tr key={shift.id}>
                  <td style={{ fontWeight: 'bold' }}>{shift.name}</td>
                  <td>{shift.start_time}</td>
                  <td>{shift.end_time}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm" onClick={() => handleEditShift(shift)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteShift(shift.id)}>
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab (admin only) */}
      {activeTab === 'users' && isAdmin && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Users</span>
            <button className="btn btn-primary" onClick={openAddModal}>{t('add')}</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Username</th><th>Display Name</th><th>Email</th><th>Role</th><th>Language</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                  <td>{u.display_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.preferred_lang}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm" onClick={() => handleEditUser(u)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id)}>
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); }}
        title={modalTitle}>
        {activeTab === 'workstations' ? (
          <div>
            <div className="form-group">
              <label className="form-label">{t('machineId')}</label>
              <input className="form-input" value={wsForm.machine_code}
                onChange={e => setWsForm(f => ({ ...f, machine_code: e.target.value }))} placeholder="e.g., M-501" />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={wsForm.name}
                onChange={e => setWsForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Assembly Line 3 - Station 1" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('area')}</label>
                <select className="form-select" value={wsForm.area_id}
                  onChange={e => setWsForm(f => ({ ...f, area_id: e.target.value }))}>
                  <option value="">--</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Team</label>
                <select className="form-select" value={wsForm.team_id}
                  onChange={e => setWsForm(f => ({ ...f, team_id: e.target.value }))}>
                  <option value="">--</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('partNumber')}</label>
              <input className="form-input" value={wsForm.default_part}
                onChange={e => setWsForm(f => ({ ...f, default_part: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleModalSave} disabled={loading}>{t('save')}</button>
              <button className="btn" onClick={() => { setShowModal(false); setEditingId(null); }}>{t('cancel')}</button>
            </div>
          </div>
        ) : activeTab === 'shifts' ? (
          <div>
            <div className="form-group">
              <label className="form-label">Shift Name</label>
              <input className="form-input" value={shiftForm.name}
                onChange={e => setShiftForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Morning Shift" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input className="form-input" type="time" value={shiftForm.start_time}
                  onChange={e => setShiftForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input className="form-input" type="time" value={shiftForm.end_time}
                  onChange={e => setShiftForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleModalSave} disabled={loading}>{t('save')}</button>
              <button className="btn" onClick={() => { setShowModal(false); setEditingId(null); }}>{t('cancel')}</button>
            </div>
          </div>
        ) : activeTab === 'users' ? (
          <div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={userForm.username}
                onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" />
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={userForm.display_name}
                onChange={e => setUserForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Full Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={userForm.role}
                  onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="team_member">Team Member</option>
                  <option value="area_leader">Area Leader</option>
                  <option value="plant_manager">Plant Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" value={userForm.preferred_lang}
                  onChange={e => setUserForm(f => ({ ...f, preferred_lang: e.target.value }))}>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Espanol</option>
                  <option value="fr">Francais</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleModalSave} disabled={loading}>{t('save')}</button>
              <button className="btn" onClick={() => { setShowModal(false); setEditingId(null); }}>{t('cancel')}</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={nameForm} onChange={e => setNameForm(e.target.value)}
                placeholder={`New ${activeTab.slice(0, -1)} name...`} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleModalSave} disabled={loading}>{t('save')}</button>
              <button className="btn" onClick={() => { setShowModal(false); setEditingId(null); }}>{t('cancel')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
