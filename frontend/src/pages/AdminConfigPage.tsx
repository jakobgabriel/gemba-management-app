import { useState } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { api } from '../api/client.js';
import Modal from '../components/common/Modal.js';

type Tab = 'workstations' | 'categories' | 'areas' | 'teams' | 'operators';

export default function AdminConfigPage() {
  const { t } = useTranslation();
  const { workstations, categories, areas, teams, operators, reloadConfig } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('workstations');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forms
  const [wsForm, setWsForm] = useState({ machine_code: '', name: '', area_id: '', team_id: '', default_part: '' });
  const [nameForm, setNameForm] = useState('');

  const handleAddWorkstation = async () => {
    setLoading(true);
    try {
      await api.createWorkstation(wsForm);
      setWsForm({ machine_code: '', name: '', area_id: '', team_id: '', default_part: '' });
      setShowModal(false);
      reloadConfig();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeleteWorkstation = async (id: string) => {
    if (!confirm('Delete this workstation?')) return;
    try { await api.deleteWorkstation(id); reloadConfig(); } catch { /* ignore */ }
  };

  const handleAddSimple = async () => {
    if (!nameForm) return;
    setLoading(true);
    try {
      if (activeTab === 'categories') await api.createCategory({ name: nameForm });
      else if (activeTab === 'areas') await api.createArea({ name: nameForm });
      else if (activeTab === 'teams') await api.createTeam({ name: nameForm });
      else if (activeTab === 'operators') await api.createOperator({ name: nameForm });
      setNameForm('');
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'workstations', label: t('workstation') + 's' },
    { key: 'categories', label: t('category') + 's' },
    { key: 'areas', label: t('area') + 's' },
    { key: 'teams', label: 'Teams' },
    { key: 'operators', label: t('operator') + 's' },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem' }}>
        {tabs.map(tab => (
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
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t('add')}</button>
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
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteWorkstation(ws.id)}>
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple list tabs */}
      {activeTab !== 'workstations' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{tabs.find(t => t.key === activeTab)?.label}</span>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t('add')}</button>
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
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSimple(item.id)}>
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={`${t('add')} ${tabs.find(t => t.key === activeTab)?.label}`}>
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
              <button className="btn btn-primary" onClick={handleAddWorkstation} disabled={loading}>{t('save')}</button>
              <button className="btn" onClick={() => setShowModal(false)}>{t('cancel')}</button>
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
              <button className="btn btn-primary" onClick={handleAddSimple} disabled={loading}>{t('save')}</button>
              <button className="btn" onClick={() => setShowModal(false)}>{t('cancel')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
