import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';
import { useApp } from '../store/AppContext.js';
import { api } from '../api/client.js';
import type { Issue } from '../types/index.js';

export default function IssueHistoryPage() {
  const { t } = useTranslation();
  const { categories } = useApp();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', category_id: '', search: '' });

  useEffect(() => { loadIssues(); }, [page, filters]);

  const loadIssues = async () => {
    try {
      const params: any = { page, per_page: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category_id) params.category = filters.category_id;
      if (filters.search) params.search = filters.search;
      const res = await api.getIssues(params);
      setIssues(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch { /* ignore */ }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* Filters */}
      <div className="filters-bar">
        <input className="form-input" placeholder={t('search') + '...'} value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
          style={{ minWidth: '200px' }} />
        <select className="form-select" value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Status</option>
          <option value="OPEN">{t('open')}</option>
          <option value="ESCALATED">{t('escalated')}</option>
          <option value="RESOLVED">{t('resolved')}</option>
        </select>
        <select className="form-select" value={filters.priority}
          onChange={e => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}>
          <option value="">All Priority</option>
          <option value="LOW">{t('low')}</option>
          <option value="MEDIUM">{t('medium')}</option>
          <option value="HIGH">{t('high')}</option>
        </select>
        <select className="form-select" value={filters.category_id}
          onChange={e => { setFilters(f => ({ ...f, category_id: e.target.value })); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {/* Results */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Issue History ({total} total)</span>
        </div>
        {issues.length === 0 ? (
          <div className="empty-state">No issues found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>{t('issueTitle')}</th><th>L</th>
                <th>{t('category')}</th><th>{t('priority')}</th><th>{t('status')}</th>
                <th>{t('area')}</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(issue => (
                <tr key={issue.id}>
                  <td>{issue.issue_number}</td>
                  <td style={{ fontWeight: 'bold' }}>{issue.title}</td>
                  <td>{issue.level}</td>
                  <td>{issue.category_name}</td>
                  <td><span className={`issue-badge ${issue.priority.toLowerCase()}`}>{issue.priority}</span></td>
                  <td><span className={`issue-badge ${issue.status.toLowerCase()}`}>{issue.status}</span></td>
                  <td>{issue.area_text}</td>
                  <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ padding: '0.4rem 1rem', border: '2px solid #000' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
