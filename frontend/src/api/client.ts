// ============================================================================
// Gemba Management System - API Client
// ============================================================================

import type {
  ApiResponse,
  ApiError,
  User,
  Issue,
  IssueEscalation,
  IssueResolution,
  ProductionEntry,
  SafetyEntry,
  GembaWalk,
  GembaWalkFinding,
  Workstation,
  Area,
  Team,
  Category,
  Shift,
  Operator,
  HandoverNote,
  DashboardData,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'gemba_token';

class ApiClient {
  private baseUrl = '/api/v1';

  // ---- Token management --------------------------------------------------

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  // ---- Generic HTTP methods ----------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Handle 401 – clear auth state and redirect to login
    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorBody: ApiError = await response.json().catch(() => ({
        data: null,
        meta: null,
        errors: [{ code: 'UNKNOWN', message: response.statusText }],
      }));
      throw errorBody;
    }

    return response.json() as Promise<ApiResponse<T>>;
  }

  private get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  private post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  private put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  private delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  // ========================================================================
  // Auth
  // ========================================================================

  login(username: string, password: string) {
    return this.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
    });
  }

  logout() {
    return this.post<void>('/auth/logout');
  }

  getMe() {
    return this.get<User>('/auth/me');
  }

  // ========================================================================
  // Issues
  // ========================================================================

  getIssues(params?: Record<string, string | number | boolean | undefined>) {
    return this.get<Issue[]>('/issues', params);
  }

  getIssue(id: string) {
    return this.get<Issue>(`/issues/${id}`);
  }

  createIssue(data: Partial<Issue>) {
    return this.post<Issue>('/issues', data);
  }

  updateIssue(id: string, data: Partial<Issue>) {
    return this.put<Issue>(`/issues/${id}`, data);
  }

  escalateIssue(id: string, data: Partial<IssueEscalation>) {
    return this.post<Issue>(`/issues/${id}/escalate`, data);
  }

  resolveIssue(id: string, data: Partial<IssueResolution>) {
    return this.post<Issue>(`/issues/${id}/resolve`, data);
  }

  getIssueHistory(id: string) {
    return this.get<Array<{ action: string; timestamp: string; user: string; details?: string }>>(
      `/issues/${id}/history`,
    );
  }

  getIssueStats() {
    return this.get<Record<string, number>>('/issues/stats');
  }

  // ========================================================================
  // Production
  // ========================================================================

  getProductionEntries(params?: Record<string, string | number | boolean | undefined>) {
    return this.get<ProductionEntry[]>('/production', params);
  }

  createProductionEntry(data: Partial<ProductionEntry>) {
    return this.post<ProductionEntry>('/production', data);
  }

  updateProductionEntry(id: string, data: Partial<ProductionEntry>) {
    return this.put<ProductionEntry>(`/production/${id}`, data);
  }

  getProductionByWorkstation(workstationId: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.get<Record<string, unknown>>(`/production/by-workstation/${workstationId}`, params);
  }

  // ========================================================================
  // Safety
  // ========================================================================

  getSafetyEntries(params?: Record<string, string | number | boolean | undefined>) {
    return this.get<SafetyEntry[]>('/safety/entries', params);
  }

  createSafetyEntry(data: Partial<SafetyEntry>) {
    return this.post<SafetyEntry>('/safety/entries', data);
  }

  getDaysWithoutAccident() {
    return this.get<{ days: number }>('/safety/days-without-accident');
  }

  getSafetyStats() {
    return this.get<Record<string, unknown>>('/safety/stats');
  }

  // ========================================================================
  // Gemba Walks
  // ========================================================================

  getGembaWalks(params?: Record<string, string | number | boolean | undefined>) {
    return this.get<GembaWalk[]>('/gemba-walks', params);
  }

  getGembaWalk(id: string) {
    return this.get<GembaWalk>(`/gemba-walks/${id}`);
  }

  createGembaWalk(data: Partial<GembaWalk>) {
    return this.post<GembaWalk>('/gemba-walks', data);
  }

  updateGembaWalk(id: string, data: Partial<GembaWalk>) {
    return this.put<GembaWalk>(`/gemba-walks/${id}`, data);
  }

  completeGembaWalk(id: string) {
    return this.post<GembaWalk>(`/gemba-walks/${id}/complete`);
  }

  addGembaWalkFinding(id: string, data: Partial<GembaWalkFinding>) {
    return this.post<GembaWalkFinding>(`/gemba-walks/${id}/findings`, data);
  }

  createGembaWalkIssue(id: string, data: Partial<Issue>) {
    return this.post<Issue>(`/gemba-walks/${id}/issues`, data);
  }

  // ========================================================================
  // Configuration
  // ========================================================================

  // -- Workstations --------------------------------------------------------

  getWorkstations() {
    return this.get<Workstation[]>('/config/workstations');
  }

  createWorkstation(data: Partial<Workstation>) {
    return this.post<Workstation>('/config/workstations', data);
  }

  updateWorkstation(id: string, data: Partial<Workstation>) {
    return this.put<Workstation>(`/config/workstations/${id}`, data);
  }

  deleteWorkstation(id: string) {
    return this.delete<void>(`/config/workstations/${id}`);
  }

  // -- Categories ----------------------------------------------------------

  getCategories() {
    return this.get<Category[]>('/config/categories');
  }

  createCategory(data: Partial<Category>) {
    return this.post<Category>('/config/categories', data);
  }

  deleteCategory(id: string) {
    return this.delete<void>(`/config/categories/${id}`);
  }

  // -- Areas ---------------------------------------------------------------

  getAreas() {
    return this.get<Area[]>('/config/areas');
  }

  createArea(data: Partial<Area>) {
    return this.post<Area>('/config/areas', data);
  }

  deleteArea(id: string) {
    return this.delete<void>(`/config/areas/${id}`);
  }

  // -- Teams ---------------------------------------------------------------

  getTeams() {
    return this.get<Team[]>('/config/teams');
  }

  createTeam(data: Partial<Team>) {
    return this.post<Team>('/config/teams', data);
  }

  deleteTeam(id: string) {
    return this.delete<void>(`/config/teams/${id}`);
  }

  // -- Operators -----------------------------------------------------------

  getOperators() {
    return this.get<Operator[]>('/config/operators');
  }

  createOperator(data: Partial<Operator>) {
    return this.post<Operator>('/config/operators', data);
  }

  deleteOperator(id: string) {
    return this.delete<void>(`/config/operators/${id}`);
  }

  // -- Shifts --------------------------------------------------------------

  getShifts() {
    return this.get<Shift[]>('/config/shifts');
  }

  // ========================================================================
  // Analytics
  // ========================================================================

  getDashboard() {
    return this.get<DashboardData>('/analytics/dashboard');
  }

  getIssueBreakdown() {
    return this.get<Record<string, unknown>>('/analytics/issues/breakdown');
  }

  getResolutionTimes() {
    return this.get<Record<string, unknown>>('/analytics/issues/resolution-times');
  }

  getProductionEfficiency(params?: Record<string, string | number | boolean | undefined>) {
    return this.get<Record<string, unknown>>('/analytics/production/efficiency', params);
  }

  aiQuery(question: string) {
    return this.post<{ query: string; keywords: string[]; total_results: number; results: unknown[] }>('/analytics/ai/query', { question });
  }

  aiReport(report_type: string) {
    return this.post<{ report_type: string; summary: string; data: unknown }>('/analytics/ai/report', { report_type });
  }

  // ========================================================================
  // Handover
  // ========================================================================

  getHandoverNotes(params?: Record<string, string | number | boolean | undefined>) {
    return this.get<HandoverNote[]>('/handover/notes', params);
  }

  createHandoverNote(data: Partial<HandoverNote>) {
    return this.post<HandoverNote>('/handover/notes', data);
  }

  getCurrentHandoverNotes() {
    return this.get<HandoverNote[]>('/handover/notes/current');
  }

  // ========================================================================
  // Issues – additional methods
  // ========================================================================

  deleteIssue(id: string) {
    return this.delete<void>(`/issues/${id}`);
  }

  // ========================================================================
  // Production – additional methods
  // ========================================================================

  deleteProductionEntry(id: string) {
    return this.delete<void>(`/production/${id}`);
  }

  // ========================================================================
  // Safety – additional methods
  // ========================================================================

  updateSafetyEntry(id: string, data: Partial<SafetyEntry>) {
    return this.put<SafetyEntry>(`/safety/entries/${id}`, data);
  }

  deleteSafetyEntry(id: string) {
    return this.delete<void>(`/safety/entries/${id}`);
  }

  getSafetyStatsWithParams(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<Record<string, unknown>>(`/safety/stats${query}`);
  }

  // ========================================================================
  // Handover – additional methods
  // ========================================================================

  updateHandoverNote(id: string, data: Partial<HandoverNote>) {
    return this.put<HandoverNote>(`/handover/notes/${id}`, data);
  }

  deleteHandoverNote(id: string) {
    return this.delete<void>(`/handover/notes/${id}`);
  }

  // ========================================================================
  // Configuration – additional methods
  // ========================================================================

  updateCategory(id: string, data: Partial<Category>) {
    return this.put<Category>(`/config/categories/${id}`, data);
  }

  updateArea(id: string, data: Partial<Area>) {
    return this.put<Area>(`/config/areas/${id}`, data);
  }

  updateTeam(id: string, data: Partial<Team>) {
    return this.put<Team>(`/config/teams/${id}`, data);
  }

  updateOperator(id: string, data: Partial<Operator>) {
    return this.put<Operator>(`/config/operators/${id}`, data);
  }

  createShift(data: Partial<Shift>) {
    return this.post<Shift>('/config/shifts', data);
  }

  updateShift(id: string, data: Partial<Shift>) {
    return this.put<Shift>(`/config/shifts/${id}`, data);
  }

  deleteShift(id: string) {
    return this.delete<void>(`/config/shifts/${id}`);
  }

  // ========================================================================
  // User Management
  // ========================================================================

  getUsers() {
    return this.get<User[]>('/users');
  }

  getUser(id: string) {
    return this.get<User>(`/users/${id}`);
  }

  createUser(data: Partial<User>) {
    return this.post<User>('/users', data);
  }

  updateUser(id: string, data: Partial<User>) {
    return this.put<User>(`/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.delete<void>(`/users/${id}`);
  }

  // ========================================================================
  // Bulk Operations
  // ========================================================================

  bulkCreateIssues(items: Partial<Issue>[]) {
    return this.post<Issue[]>('/bulk/issues/bulk-create', { items });
  }

  bulkUpdateIssues(items: Partial<Issue>[]) {
    return this.post<Issue[]>('/bulk/issues/bulk-update', { items });
  }

  bulkDeleteIssues(ids: string[]) {
    return this.post<void>('/bulk/issues/bulk-delete', { ids });
  }

  bulkCreateProduction(items: Partial<ProductionEntry>[]) {
    return this.post<ProductionEntry[]>('/bulk/production/bulk-create', { items });
  }

  bulkCreateSafety(items: Partial<SafetyEntry>[]) {
    return this.post<SafetyEntry[]>('/bulk/safety/bulk-create', { items });
  }

  bulkImportConfig(entity: string, items: unknown[]) {
    return this.post<unknown>('/bulk/config/bulk-import', { entity, items });
  }

  // ========================================================================
  // Export
  // ========================================================================

  exportIssues(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<unknown>(`/bulk/export/issues${query}`);
  }

  exportProduction(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<unknown>(`/bulk/export/production${query}`);
  }

  exportSafety(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<unknown>(`/bulk/export/safety${query}`);
  }

  exportConfig(entity: string) {
    return this.get<unknown>(`/bulk/export/config?entity=${entity}`);
  }

  exportGembaWalks(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<unknown>(`/bulk/export/gemba-walks${query}`);
  }
}

// Export singleton instance
export const api = new ApiClient();
