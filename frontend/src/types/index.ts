// ============================================================================
// Gemba Management System - TypeScript Type Definitions
// ============================================================================

// --- Enums / Union Types ---

export type Role = 'team_member' | 'area_leader' | 'plant_manager' | 'admin';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type IssueStatus = 'OPEN' | 'ESCALATED' | 'RESOLVED';

export type SafetyStatus = 'safe' | 'near-miss' | 'incident' | 'not-reported';

export type IssueSource = 'production' | 'gemba';

export type WalkStatus = 'in_progress' | 'completed' | 'cancelled';

// --- Core Domain Models ---

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: Role;
  role_level: number;
  plant_id: string;
  team_id?: string;
  preferred_lang: string;
}

export interface Issue {
  id: string;
  issue_number: number;
  level: number;
  title: string;
  area_id?: string;
  area_text?: string;
  category_id?: string;
  category_name?: string;
  subcategory?: string;
  priority: Priority;
  status: IssueStatus;
  description?: string;
  contact_person?: string;
  source: IssueSource;
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  ai_suggestion?: {
    suggested_level: number;
    reason: string;
    confidence: number;
  };
  resolution?: IssueResolution;
}

export interface IssueResolution {
  resolution: string;
  resolved_by: string;
  resolved_at: string;
  downtime_prevented: number;
  defects_reduced: number;
  cost_savings: number;
}

export interface IssueEscalation {
  from_level: number;
  to_level: number;
  reason: string;
  actions_taken: string;
  support_needed: string;
  escalated_at: string;
}

// --- Production ---

export interface ProductionEntry {
  id: string;
  workstation_id: string;
  machine_code?: string;
  workstation_name?: string;
  shift_id: string;
  shift_name?: string;
  entry_date: string;
  hour: number;
  target: number;
  actual: number;
  part_number?: string;
  notes?: string;
}

// --- Safety ---

export interface SafetyEntry {
  id: string;
  entry_date: string;
  shift_id: string;
  shift_name?: string;
  status: SafetyStatus;
  team_id?: string;
  team_name?: string;
  area_id?: string;
  area_name?: string;
  notes?: string;
}

// --- Gemba Walks ---

export interface GembaWalk {
  id: string;
  leader_id: string;
  leader_name?: string;
  target_areas?: string;
  focus?: string;
  participants?: string;
  team_feedback?: string;
  status: WalkStatus;
  current_step: number;
  started_at: string;
  completed_at?: string;
  duration_min?: number;
  findings?: GembaWalkFinding[];
  issues_count?: number;
}

export interface GembaWalkFinding {
  id: string;
  observation: string;
  area_id?: string;
  finding_type?: string;
}

// --- Configuration Entities ---

export interface Workstation {
  id: string;
  machine_code: string;
  name: string;
  area_id: string;
  area_name?: string;
  team_id?: string;
  team_name?: string;
  default_part?: string;
  is_active: boolean;
}

export interface Area {
  id: string;
  name: string;
  code?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

export interface Operator {
  id: string;
  name: string;
  team_id?: string;
  team_name?: string;
}

export interface HandoverNote {
  id: string;
  shift_id: string;
  shift_name?: string;
  note_date: string;
  content: string;
  created_by: string;
  creator_name?: string;
  created_at: string;
}

// --- API Response Wrappers ---

export interface ApiResponse<T> {
  data: T;
  meta: PaginationMeta | null;
  errors: null;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  data: null;
  meta: null;
  errors: Array<{
    code: string;
    field?: string;
    message: string;
  }>;
}

// --- Dashboard / Analytics ---

export interface DashboardData {
  total_issues: number;
  by_status: Record<IssueStatus, number>;
  by_level: Record<string, number>;
  recent_issues: Issue[];
}
