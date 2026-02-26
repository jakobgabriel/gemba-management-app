import type { OpenAPIV3 } from 'openapi-types';

// ---------------------------------------------------------------------------
// Reusable schema components
// ---------------------------------------------------------------------------
const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  // ── Envelope wrappers ────────────────────────────────────────────────
  ApiError: {
    type: 'object',
    properties: {
      code: { type: 'string', example: 'VALIDATION_ERROR' },
      field: { type: 'string', example: 'title' },
      message: { type: 'string', example: 'Title is required' },
    },
    required: ['code', 'message'],
  },
  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      per_page: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 100 },
      total_pages: { type: 'integer', example: 5 },
    },
  },

  // ── Auth ──────────────────────────────────────────────────────────────
  LoginRequest: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', example: 'admin' },
      password: { type: 'string', example: 'admin123' },
    },
  },
  LoginResponse: {
    type: 'object',
    properties: {
      token: { type: 'string' },
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
      token_type: { type: 'string', example: 'Bearer' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          role: { type: 'string' },
          role_level: { type: 'integer' },
          plant_id: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
  RefreshRequest: {
    type: 'object',
    required: ['refresh_token'],
    properties: {
      refresh_token: { type: 'string' },
    },
  },
  RefreshResponse: {
    type: 'object',
    properties: {
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
      token_type: { type: 'string', example: 'Bearer' },
    },
  },
  UserProfile: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      username: { type: 'string' },
      email: { type: 'string', format: 'email' },
      display_name: { type: 'string' },
      role: { type: 'string' },
      role_level: { type: 'integer' },
      plant_id: { type: 'string', format: 'uuid' },
      team_id: { type: 'string', format: 'uuid', nullable: true },
      preferred_lang: { type: 'string', example: 'en' },
    },
  },

  // ── Users ─────────────────────────────────────────────────────────────
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      username: { type: 'string' },
      email: { type: 'string', format: 'email' },
      display_name: { type: 'string' },
      preferred_lang: { type: 'string' },
      is_active: { type: 'boolean' },
      role: { type: 'string' },
      role_level: { type: 'integer' },
      team_name: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateUserRequest: {
    type: 'object',
    required: ['username', 'password', 'email', 'full_name', 'role_id', 'plant_id'],
    properties: {
      username: { type: 'string' },
      password: { type: 'string' },
      email: { type: 'string', format: 'email' },
      full_name: { type: 'string' },
      role_id: { type: 'string', format: 'uuid' },
      team_id: { type: 'string', format: 'uuid' },
      plant_id: { type: 'string', format: 'uuid' },
      is_active: { type: 'boolean', default: true },
    },
  },
  UpdateUserRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      full_name: { type: 'string' },
      role_id: { type: 'string', format: 'uuid' },
      team_id: { type: 'string', format: 'uuid' },
      plant_id: { type: 'string', format: 'uuid' },
      is_active: { type: 'boolean' },
      password: { type: 'string' },
    },
  },

  // ── Issues ────────────────────────────────────────────────────────────
  Issue: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      description: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['OPEN', 'ESCALATED', 'RESOLVED'] },
      level: { type: 'integer', minimum: 1, maximum: 4 },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      category_id: { type: 'string', format: 'uuid', nullable: true },
      category_name: { type: 'string', nullable: true },
      area_id: { type: 'string', format: 'uuid', nullable: true },
      area_name: { type: 'string', nullable: true },
      source: { type: 'string', enum: ['manual', 'gemba', 'production'] },
      created_by: { type: 'string', format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateIssueRequest: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      category_id: { type: 'string', format: 'uuid' },
      area_id: { type: 'string', format: 'uuid' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
      level: { type: 'integer', minimum: 1, maximum: 4, default: 1 },
      source: { type: 'string', enum: ['manual', 'gemba', 'production'], default: 'manual' },
    },
  },
  UpdateIssueRequest: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      category_id: { type: 'string', format: 'uuid' },
      area_id: { type: 'string', format: 'uuid' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      status: { type: 'string', enum: ['OPEN', 'ESCALATED', 'RESOLVED'] },
      level: { type: 'integer' },
    },
  },
  EscalateRequest: {
    type: 'object',
    required: ['target_level', 'reason'],
    properties: {
      target_level: { type: 'integer', minimum: 2 },
      reason: { type: 'string' },
    },
  },
  ResolveRequest: {
    type: 'object',
    required: ['resolution'],
    properties: {
      resolution: { type: 'string' },
      downtime_prevented: { type: 'integer' },
      defects_reduced: { type: 'integer' },
      cost_savings: { type: 'number' },
    },
  },
  IssueStats: {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      by_status: {
        type: 'array',
        items: {
          type: 'object',
          properties: { status: { type: 'string' }, count: { type: 'integer' } },
        },
      },
      by_level: {
        type: 'array',
        items: {
          type: 'object',
          properties: { level: { type: 'integer' }, count: { type: 'integer' } },
        },
      },
      by_category: {
        type: 'array',
        items: {
          type: 'object',
          properties: { category: { type: 'string' }, count: { type: 'integer' } },
        },
      },
    },
  },
  IssueHistory: {
    type: 'object',
    properties: {
      escalations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            from_level: { type: 'integer' },
            to_level: { type: 'integer' },
            reason: { type: 'string' },
            escalated_at: { type: 'string', format: 'date-time' },
            escalated_by_username: { type: 'string' },
            escalated_by_name: { type: 'string' },
          },
        },
      },
      resolution: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string', format: 'uuid' },
          resolution: { type: 'string' },
          resolved_at: { type: 'string', format: 'date-time' },
          downtime_prevented: { type: 'integer', nullable: true },
          defects_reduced: { type: 'integer', nullable: true },
          cost_savings: { type: 'number', nullable: true },
          resolved_by_username: { type: 'string' },
          resolved_by_name: { type: 'string' },
        },
      },
    },
  },

  // ── Production ────────────────────────────────────────────────────────
  ProductionEntry: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      workstation_id: { type: 'string', format: 'uuid' },
      machine_code: { type: 'string' },
      workstation_name: { type: 'string' },
      shift_id: { type: 'string', format: 'uuid' },
      shift_name: { type: 'string' },
      entry_date: { type: 'string', format: 'date' },
      hour: { type: 'integer', minimum: 0, maximum: 23 },
      target: { type: 'integer' },
      actual: { type: 'integer' },
      part_number: { type: 'string', nullable: true },
      notes: { type: 'string', nullable: true },
      created_by: { type: 'string', format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateProductionEntryRequest: {
    type: 'object',
    required: ['workstation_id', 'shift_id', 'entry_date', 'hour'],
    properties: {
      workstation_id: { type: 'string', format: 'uuid' },
      shift_id: { type: 'string', format: 'uuid' },
      entry_date: { type: 'string', format: 'date' },
      hour: { type: 'integer', minimum: 0, maximum: 23 },
      target: { type: 'integer', default: 0 },
      actual: { type: 'integer', default: 0 },
      part_number: { type: 'string' },
      notes: { type: 'string' },
    },
  },
  UpdateProductionEntryRequest: {
    type: 'object',
    properties: {
      target: { type: 'integer' },
      actual: { type: 'integer' },
      part_number: { type: 'string' },
      notes: { type: 'string' },
    },
  },
  WorkstationProductionSummary: {
    type: 'object',
    properties: {
      workstation_id: { type: 'string', format: 'uuid' },
      entries: { type: 'array', items: { $ref: '#/components/schemas/ProductionEntry' } as unknown as OpenAPIV3.SchemaObject },
      summary: {
        type: 'object',
        properties: {
          total_target: { type: 'integer' },
          total_actual: { type: 'integer' },
          efficiency_pct: { type: 'number' },
          entries_count: { type: 'integer' },
        },
      },
    },
  },

  // ── Safety ────────────────────────────────────────────────────────────
  SafetyEntry: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      entry_date: { type: 'string', format: 'date' },
      shift_id: { type: 'string', format: 'uuid' },
      team_id: { type: 'string', format: 'uuid', nullable: true },
      team_name: { type: 'string', nullable: true },
      area_id: { type: 'string', format: 'uuid', nullable: true },
      area_name: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['safe', 'near-miss', 'incident', 'not-reported'] },
      notes: { type: 'string', nullable: true },
      created_by: { type: 'string', format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateSafetyEntryRequest: {
    type: 'object',
    required: ['entry_date', 'shift_id'],
    properties: {
      entry_date: { type: 'string', format: 'date' },
      shift_id: { type: 'string', format: 'uuid' },
      team_id: { type: 'string', format: 'uuid' },
      area_id: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: ['safe', 'near-miss', 'incident', 'not-reported'], default: 'safe' },
      notes: { type: 'string' },
    },
  },
  SafetyStats: {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      by_status: {
        type: 'array',
        items: {
          type: 'object',
          properties: { status: { type: 'string' }, count: { type: 'integer' } },
        },
      },
      monthly_trend: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            month: { type: 'string' },
            total: { type: 'integer' },
            incidents: { type: 'integer' },
            near_misses: { type: 'integer' },
            safe_observations: { type: 'integer' },
          },
        },
      },
    },
  },
  DaysWithoutAccident: {
    type: 'object',
    properties: {
      days_without_accident: { type: 'integer' },
      last_incident_date: { type: 'string', format: 'date', nullable: true },
    },
  },

  // ── Gemba Walks ───────────────────────────────────────────────────────
  GembaWalk: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: ['in_progress', 'completed', 'cancelled'] },
      target_areas: { type: 'string' },
      focus: { type: 'string' },
      participants: { type: 'string' },
      current_step: { type: 'integer', minimum: 1, maximum: 5 },
      team_feedback: { type: 'string', nullable: true },
      duration_min: { type: 'integer', nullable: true },
      leader_id: { type: 'string', format: 'uuid' },
      leader_username: { type: 'string' },
      leader_name: { type: 'string' },
      started_at: { type: 'string', format: 'date-time' },
      completed_at: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  CreateGembaWalkRequest: {
    type: 'object',
    required: ['focus'],
    properties: {
      target_areas: { type: 'array', items: { type: 'string' } },
      focus: { type: 'string' },
      participants: { type: 'array', items: { type: 'string' } },
    },
  },
  UpdateGembaWalkRequest: {
    type: 'object',
    properties: {
      current_step: { type: 'integer' },
      team_feedback: { type: 'string' },
      focus: { type: 'string' },
      target_areas: { type: 'array', items: { type: 'string' } },
      participants: { type: 'array', items: { type: 'string' } },
    },
  },
  GembaWalkFinding: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      observation: { type: 'string' },
      finding_type: { type: 'string' },
      area_id: { type: 'string', format: 'uuid', nullable: true },
      area_name: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateFindingRequest: {
    type: 'object',
    required: ['observation'],
    properties: {
      observation: { type: 'string' },
      finding_type: { type: 'string', default: 'observation' },
      area_id: { type: 'string', format: 'uuid' },
    },
  },

  // ── Config entities ───────────────────────────────────────────────────
  Workstation: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      machine_code: { type: 'string' },
      name: { type: 'string' },
      area_id: { type: 'string', format: 'uuid' },
      team_id: { type: 'string', format: 'uuid', nullable: true },
      default_part: { type: 'string', nullable: true },
      is_active: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateWorkstationRequest: {
    type: 'object',
    required: ['name', 'machine_code', 'area_id'],
    properties: {
      name: { type: 'string' },
      machine_code: { type: 'string' },
      area_id: { type: 'string', format: 'uuid' },
      team_id: { type: 'string', format: 'uuid' },
      default_part: { type: 'string' },
      is_active: { type: 'boolean', default: true },
    },
  },
  Category: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      sort_order: { type: 'integer' },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  Area: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      code: { type: 'string', nullable: true },
      plant_id: { type: 'string', format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  Team: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      plant_id: { type: 'string', format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  Operator: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      team_id: { type: 'string', format: 'uuid', nullable: true },
      user_id: { type: 'string', format: 'uuid', nullable: true },
      is_active: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  ShiftDefinition: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      start_time: { type: 'string', example: '06:00' },
      end_time: { type: 'string', example: '14:00' },
      sort_order: { type: 'integer' },
      created_at: { type: 'string', format: 'date-time' },
    },
  },

  // ── Handover ──────────────────────────────────────────────────────────
  HandoverNote: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      note_date: { type: 'string', format: 'date' },
      shift_id: { type: 'string', format: 'uuid' },
      shift_name: { type: 'string' },
      content: { type: 'string', nullable: true },
      created_by: { type: 'string', format: 'uuid' },
      created_by_name: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  CreateHandoverNoteRequest: {
    type: 'object',
    required: ['note_date', 'shift_id'],
    properties: {
      note_date: { type: 'string', format: 'date' },
      shift_id: { type: 'string', format: 'uuid' },
      content: { type: 'string' },
    },
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  DashboardData: {
    type: 'object',
    properties: {
      total_issues: { type: 'integer' },
      open_issues: { type: 'integer' },
      escalated_issues: { type: 'integer' },
      by_status: {
        type: 'array',
        items: {
          type: 'object',
          properties: { status: { type: 'string' }, count: { type: 'integer' } },
        },
      },
      by_level: {
        type: 'array',
        items: {
          type: 'object',
          properties: { level: { type: 'integer' }, count: { type: 'integer' } },
        },
      },
      recent_issues: { type: 'array', items: { $ref: '#/components/schemas/Issue' } as unknown as OpenAPIV3.SchemaObject },
    },
  },
  CategoryBreakdown: {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      breakdown: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            count: { type: 'integer' },
            percentage: { type: 'number' },
          },
        },
      },
    },
  },
  ResolutionTimes: {
    type: 'object',
    properties: {
      total_resolved: { type: 'integer' },
      avg_resolution_hours: { type: 'number' },
      min_resolution_hours: { type: 'number' },
      max_resolution_hours: { type: 'number' },
      by_category: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            count: { type: 'integer' },
            avg_hours: { type: 'number' },
          },
        },
      },
    },
  },
  ProductionEfficiency: {
    type: 'object',
    properties: {
      overall: {
        type: 'object',
        properties: {
          total_actual: { type: 'integer' },
          total_target: { type: 'integer' },
          efficiency_pct: { type: 'number' },
        },
      },
      daily_trend: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            actual: { type: 'integer' },
            target: { type: 'integer' },
            efficiency_pct: { type: 'number' },
          },
        },
      },
      by_workstation: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            workstation: { type: 'string' },
            actual: { type: 'integer' },
            target: { type: 'integer' },
            efficiency_pct: { type: 'number' },
          },
        },
      },
    },
  },
  AiQueryRequest: {
    type: 'object',
    required: ['question'],
    properties: {
      question: { type: 'string', example: 'Show me issues related to machine breakdowns' },
    },
  },
  AiQueryResponse: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } },
      total_results: { type: 'integer' },
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            level: { type: 'integer' },
            priority: { type: 'string' },
            category: { type: 'string' },
            relevance_score: { type: 'integer' },
          },
        },
      },
    },
  },
  AiReportRequest: {
    type: 'object',
    required: ['report_type'],
    properties: {
      report_type: { type: 'string', enum: ['resolution-times', 'category-breakdown', 'escalation-analysis'] },
      from_date: { type: 'string', format: 'date' },
      to_date: { type: 'string', format: 'date' },
    },
  },
  AiReportResponse: {
    type: 'object',
    properties: {
      report_type: { type: 'string' },
      generated_at: { type: 'string', format: 'date-time' },
      from_date: { type: 'string', format: 'date', nullable: true },
      to_date: { type: 'string', format: 'date', nullable: true },
      summary: { type: 'string' },
      data: { type: 'object' },
    },
  },

  // ── Bulk ──────────────────────────────────────────────────────────────
  BulkCreateIssuesRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/CreateIssueRequest' } as unknown as OpenAPIV3.SchemaObject,
      },
    },
  },
  BulkUpdateIssuesRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            category_id: { type: 'string', format: 'uuid' },
            area_id: { type: 'string', format: 'uuid' },
            priority: { type: 'string' },
            status: { type: 'string' },
            level: { type: 'integer' },
          },
        },
      },
    },
  },
  BulkDeleteIssuesRequest: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
    },
  },
  BulkCreateProductionRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['workstation_id', 'entry_date', 'hour', 'target', 'actual'],
          properties: {
            workstation_id: { type: 'string', format: 'uuid' },
            entry_date: { type: 'string', format: 'date' },
            hour: { type: 'integer' },
            target: { type: 'integer' },
            actual: { type: 'integer' },
            notes: { type: 'string' },
          },
        },
      },
    },
  },
  BulkCreateSafetyRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['plant_id', 'entry_date', 'shift_id', 'team_id'],
          properties: {
            plant_id: { type: 'string', format: 'uuid' },
            entry_date: { type: 'string', format: 'date' },
            shift_id: { type: 'string', format: 'uuid' },
            team_id: { type: 'string', format: 'uuid' },
            area_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', default: 'SAFE' },
            notes: { type: 'string' },
          },
        },
      },
    },
  },
  BulkConfigImportRequest: {
    type: 'object',
    required: ['entity', 'items'],
    properties: {
      entity: { type: 'string', enum: ['workstations', 'categories', 'areas', 'teams', 'operators'] },
      items: { type: 'array', items: { type: 'object' } },
    },
  },
};

// ---------------------------------------------------------------------------
// Helper to wrap data in the standard envelope
// ---------------------------------------------------------------------------
function envelope(dataSchema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, meta?: OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject {
  return {
    type: 'object',
    properties: {
      data: dataSchema as OpenAPIV3.SchemaObject,
      meta: meta ?? { type: 'object', nullable: true },
      errors: { type: 'array', items: { $ref: '#/components/schemas/ApiError' } as unknown as OpenAPIV3.SchemaObject, nullable: true },
    },
  };
}

function ref(name: string): OpenAPIV3.ReferenceObject {
  return { $ref: `#/components/schemas/${name}` };
}

function okJson(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): OpenAPIV3.ResponseObject {
  return { description: 'Successful response', content: { 'application/json': { schema: schema as OpenAPIV3.SchemaObject } } };
}

function createdJson(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): OpenAPIV3.ResponseObject {
  return { description: 'Created', content: { 'application/json': { schema: schema as OpenAPIV3.SchemaObject } } };
}

function bodyJson(schemaRef: OpenAPIV3.ReferenceObject): OpenAPIV3.RequestBodyObject {
  return { required: true, content: { 'application/json': { schema: schemaRef as unknown as OpenAPIV3.SchemaObject } } };
}

// Pagination query params
const paginationParams: OpenAPIV3.ParameterObject[] = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'per_page', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
];

const idParam: OpenAPIV3.ParameterObject = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

const errorResponses: Record<string, OpenAPIV3.ResponseObject> = {
  '400': { description: 'Bad Request — validation error' },
  '401': { description: 'Unauthorized — missing or invalid token' },
  '403': { description: 'Forbidden — insufficient role level' },
  '404': { description: 'Not Found' },
};

// ---------------------------------------------------------------------------
// Build paths
// ---------------------------------------------------------------------------
const paths: OpenAPIV3.PathsObject = {
  // ── Health ─────────────────────────────────────────────────────────
  '/healthz': {
    get: {
      tags: ['Health'],
      summary: 'Liveness check',
      responses: { '200': okJson({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) },
    },
  },
  '/readyz': {
    get: {
      tags: ['Health'],
      summary: 'Readiness check',
      responses: { '200': okJson({ type: 'object', properties: { status: { type: 'string', example: 'ready' } } }) },
    },
  },

  // ── Auth ───────────────────────────────────────────────────────────
  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login with username and password',
      requestBody: bodyJson(ref('LoginRequest')),
      responses: { '200': okJson(envelope(ref('LoginResponse'))), ...errorResponses },
    },
  },
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh an access token',
      requestBody: bodyJson(ref('RefreshRequest')),
      responses: { '200': okJson(envelope(ref('RefreshResponse'))), ...errorResponses },
    },
  },
  '/api/v1/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout (no-op server-side)',
      responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })) },
    },
  },
  '/api/v1/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      responses: { '200': okJson(envelope(ref('UserProfile'))), ...errorResponses },
    },
  },

  // ── Users ──────────────────────────────────────────────────────────
  '/api/v1/users': {
    get: {
      tags: ['Users'],
      summary: 'List all users (admin)',
      security: [{ bearerAuth: [] }],
      responses: { '200': okJson(envelope({ type: 'array', items: ref('User') as unknown as OpenAPIV3.SchemaObject })), ...errorResponses },
    },
    post: {
      tags: ['Users'],
      summary: 'Create a user (admin)',
      security: [{ bearerAuth: [] }],
      requestBody: bodyJson(ref('CreateUserRequest')),
      responses: { '201': createdJson(envelope(ref('User'))), ...errorResponses },
    },
  },
  '/api/v1/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get a single user (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope(ref('User'))), ...errorResponses },
    },
    put: {
      tags: ['Users'],
      summary: 'Update a user (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('UpdateUserRequest')),
      responses: { '200': okJson(envelope(ref('User'))), ...errorResponses },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete a user (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses },
    },
  },

  // ── Issues ─────────────────────────────────────────────────────────
  '/api/v1/issues': {
    get: {
      tags: ['Issues'],
      summary: 'List issues with filtering, sorting, and pagination',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'ESCALATED', 'RESOLVED'] } },
        { name: 'level', in: 'query', schema: { type: 'integer' } },
        { name: 'category_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } },
        { name: 'area_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'updated_at', 'priority', 'level', 'status', 'title'], default: 'created_at' } },
        { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' } },
      ],
      responses: { '200': okJson(envelope({ type: 'array', items: ref('Issue') as unknown as OpenAPIV3.SchemaObject }, schemas.PaginationMeta)), ...errorResponses },
    },
    post: {
      tags: ['Issues'],
      summary: 'Create a new issue (generates AI suggestion)',
      security: [{ bearerAuth: [] }],
      requestBody: bodyJson(ref('CreateIssueRequest')),
      responses: { '201': createdJson(envelope(ref('Issue'))), ...errorResponses },
    },
  },
  '/api/v1/issues/stats': {
    get: {
      tags: ['Issues'],
      summary: 'Get issue statistics (role level 2+)',
      security: [{ bearerAuth: [] }],
      responses: { '200': okJson(envelope(ref('IssueStats'))), ...errorResponses },
    },
  },
  '/api/v1/issues/{id}': {
    get: {
      tags: ['Issues'],
      summary: 'Get a single issue',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope(ref('Issue'))), ...errorResponses },
    },
    put: {
      tags: ['Issues'],
      summary: 'Update an issue',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('UpdateIssueRequest')),
      responses: { '200': okJson(envelope(ref('Issue'))), ...errorResponses },
    },
    delete: {
      tags: ['Issues'],
      summary: 'Delete an issue and related records (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses },
    },
  },
  '/api/v1/issues/{id}/escalate': {
    post: {
      tags: ['Issues'],
      summary: 'Escalate an issue to a higher level',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('EscalateRequest')),
      responses: { '200': okJson(envelope({ type: 'object', properties: { issue: ref('Issue') as unknown as OpenAPIV3.SchemaObject, escalation: { type: 'object' } } })), ...errorResponses },
    },
  },
  '/api/v1/issues/{id}/resolve': {
    post: {
      tags: ['Issues'],
      summary: 'Resolve an issue (role level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('ResolveRequest')),
      responses: { '200': okJson(envelope({ type: 'object', properties: { issue: ref('Issue') as unknown as OpenAPIV3.SchemaObject, resolution: { type: 'object' } } })), ...errorResponses },
    },
  },
  '/api/v1/issues/{id}/history': {
    get: {
      tags: ['Issues'],
      summary: 'Get escalation and resolution history (role level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope(ref('IssueHistory'))), ...errorResponses },
    },
  },

  // ── Production ─────────────────────────────────────────────────────
  '/api/v1/production': {
    get: {
      tags: ['Production'],
      summary: 'List production entries with filters and pagination',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        { name: 'workstation_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'shift_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'entry_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: { '200': okJson(envelope({ type: 'array', items: ref('ProductionEntry') as unknown as OpenAPIV3.SchemaObject }, schemas.PaginationMeta)), ...errorResponses },
    },
    post: {
      tags: ['Production'],
      summary: 'Create or upsert a production entry',
      security: [{ bearerAuth: [] }],
      requestBody: bodyJson(ref('CreateProductionEntryRequest')),
      responses: { '201': createdJson(envelope(ref('ProductionEntry'))), ...errorResponses },
    },
  },
  '/api/v1/production/by-workstation/{workstationId}': {
    get: {
      tags: ['Production'],
      summary: 'Get production data for a specific workstation',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'workstationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'shift_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { '200': okJson(envelope(ref('WorkstationProductionSummary'))), ...errorResponses },
    },
  },
  '/api/v1/production/{id}': {
    put: {
      tags: ['Production'],
      summary: 'Update a production entry',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('UpdateProductionEntryRequest')),
      responses: { '200': okJson(envelope(ref('ProductionEntry'))), ...errorResponses },
    },
    delete: {
      tags: ['Production'],
      summary: 'Delete a production entry (role level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses },
    },
  },

  // ── Safety ─────────────────────────────────────────────────────────
  '/api/v1/safety/entries': {
    get: {
      tags: ['Safety'],
      summary: 'List safety entries with filters and pagination',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'team_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'area_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['safe', 'near-miss', 'incident', 'not-reported'] } },
      ],
      responses: { '200': okJson(envelope({ type: 'array', items: ref('SafetyEntry') as unknown as OpenAPIV3.SchemaObject }, schemas.PaginationMeta)), ...errorResponses },
    },
    post: {
      tags: ['Safety'],
      summary: 'Create or upsert a safety entry',
      security: [{ bearerAuth: [] }],
      requestBody: bodyJson(ref('CreateSafetyEntryRequest')),
      responses: { '201': createdJson(envelope(ref('SafetyEntry'))), ...errorResponses },
    },
  },
  '/api/v1/safety/entries/{id}': {
    put: {
      tags: ['Safety'],
      summary: 'Update a safety entry',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, notes: { type: 'string' } } } } } },
      responses: { '200': okJson(envelope(ref('SafetyEntry'))), ...errorResponses },
    },
    delete: {
      tags: ['Safety'],
      summary: 'Delete a safety entry (role level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses },
    },
  },
  '/api/v1/safety/stats': {
    get: {
      tags: ['Safety'],
      summary: 'Get safety statistics (role level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: { '200': okJson(envelope(ref('SafetyStats'))), ...errorResponses },
    },
  },
  '/api/v1/safety/days-without-accident': {
    get: {
      tags: ['Safety'],
      summary: 'Get days since last incident',
      security: [{ bearerAuth: [] }],
      responses: { '200': okJson(envelope(ref('DaysWithoutAccident'))), ...errorResponses },
    },
  },

  // ── Gemba Walks ────────────────────────────────────────────────────
  '/api/v1/gemba-walks': {
    get: {
      tags: ['Gemba Walks'],
      summary: 'List gemba walks (role level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['in_progress', 'completed', 'cancelled'] } },
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: { '200': okJson(envelope({ type: 'array', items: ref('GembaWalk') as unknown as OpenAPIV3.SchemaObject }, schemas.PaginationMeta)), ...errorResponses },
    },
    post: {
      tags: ['Gemba Walks'],
      summary: 'Start a new gemba walk (role level 2+)',
      security: [{ bearerAuth: [] }],
      requestBody: bodyJson(ref('CreateGembaWalkRequest')),
      responses: { '201': createdJson(envelope(ref('GembaWalk'))), ...errorResponses },
    },
  },
  '/api/v1/gemba-walks/{id}': {
    get: {
      tags: ['Gemba Walks'],
      summary: 'Get a walk with findings and issues',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: { '200': okJson(envelope(ref('GembaWalk'))), ...errorResponses },
    },
    put: {
      tags: ['Gemba Walks'],
      summary: 'Update walk (step, feedback)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('UpdateGembaWalkRequest')),
      responses: { '200': okJson(envelope(ref('GembaWalk'))), ...errorResponses },
    },
  },
  '/api/v1/gemba-walks/{id}/complete': {
    post: {
      tags: ['Gemba Walks'],
      summary: 'Complete a gemba walk',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { duration_min: { type: 'integer' } } } } } },
      responses: { '200': okJson(envelope(ref('GembaWalk'))), ...errorResponses },
    },
  },
  '/api/v1/gemba-walks/{id}/findings': {
    post: {
      tags: ['Gemba Walks'],
      summary: 'Add a finding to a walk',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('CreateFindingRequest')),
      responses: { '201': createdJson(envelope(ref('GembaWalkFinding'))), ...errorResponses },
    },
  },
  '/api/v1/gemba-walks/{id}/issues': {
    post: {
      tags: ['Gemba Walks'],
      summary: 'Create an issue from a gemba walk',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: bodyJson(ref('CreateIssueRequest')),
      responses: { '201': createdJson(envelope(ref('Issue'))), ...errorResponses },
    },
  },

  // ── Config ─────────────────────────────────────────────────────────
  '/api/v1/config/workstations': {
    get: { tags: ['Config'], summary: 'List workstations', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope({ type: 'array', items: ref('Workstation') as unknown as OpenAPIV3.SchemaObject })), ...errorResponses } },
    post: { tags: ['Config'], summary: 'Create a workstation (admin)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('CreateWorkstationRequest')), responses: { '201': createdJson(envelope(ref('Workstation'))), ...errorResponses } },
  },
  '/api/v1/config/workstations/{id}': {
    put: { tags: ['Config'], summary: 'Update a workstation (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: bodyJson(ref('CreateWorkstationRequest')), responses: { '200': okJson(envelope(ref('Workstation'))), ...errorResponses } },
    delete: { tags: ['Config'], summary: 'Delete a workstation (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses } },
  },
  '/api/v1/config/categories': {
    get: { tags: ['Config'], summary: 'List issue categories', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope({ type: 'array', items: ref('Category') as unknown as OpenAPIV3.SchemaObject })), ...errorResponses } },
    post: { tags: ['Config'], summary: 'Create a category (admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sort_order: { type: 'integer' } } } } } }, responses: { '201': createdJson(envelope(ref('Category'))), ...errorResponses } },
  },
  '/api/v1/config/categories/{id}': {
    put: { tags: ['Config'], summary: 'Update a category (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, sort_order: { type: 'integer' } } } } } }, responses: { '200': okJson(envelope(ref('Category'))), ...errorResponses } },
    delete: { tags: ['Config'], summary: 'Delete a category (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses } },
  },
  '/api/v1/config/areas': {
    get: { tags: ['Config'], summary: 'List areas', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope({ type: 'array', items: ref('Area') as unknown as OpenAPIV3.SchemaObject })), ...errorResponses } },
    post: { tags: ['Config'], summary: 'Create an area (admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, code: { type: 'string' } } } } } }, responses: { '201': createdJson(envelope(ref('Area'))), ...errorResponses } },
  },
  '/api/v1/config/areas/{id}': {
    put: { tags: ['Config'], summary: 'Update an area (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } } } } }, responses: { '200': okJson(envelope(ref('Area'))), ...errorResponses } },
    delete: { tags: ['Config'], summary: 'Delete an area (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses } },
  },
  '/api/v1/config/teams': {
    get: { tags: ['Config'], summary: 'List teams', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope({ type: 'array', items: ref('Team') as unknown as OpenAPIV3.SchemaObject })), ...errorResponses } },
    post: { tags: ['Config'], summary: 'Create a team (admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': createdJson(envelope(ref('Team'))), ...errorResponses } },
  },
  '/api/v1/config/teams/{id}': {
    put: { tags: ['Config'], summary: 'Update a team (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': okJson(envelope(ref('Team'))), ...errorResponses } },
    delete: { tags: ['Config'], summary: 'Delete a team (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses } },
  },
  '/api/v1/config/operators': {
    get: { tags: ['Config'], summary: 'List operators', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope({ type: 'array', items: ref('Operator') as unknown as OpenAPIV3.SchemaObject })), ...errorResponses } },
    post: { tags: ['Config'], summary: 'Create an operator (admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, team_id: { type: 'string', format: 'uuid' }, user_id: { type: 'string', format: 'uuid' }, is_active: { type: 'boolean' } } } } } }, responses: { '201': createdJson(envelope(ref('Operator'))), ...errorResponses } },
  },
  '/api/v1/config/operators/{id}': {
    put: { tags: ['Config'], summary: 'Update an operator (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, team_id: { type: 'string', format: 'uuid' }, user_id: { type: 'string', format: 'uuid' }, is_active: { type: 'boolean' } } } } } }, responses: { '200': okJson(envelope(ref('Operator'))), ...errorResponses } },
    delete: { tags: ['Config'], summary: 'Delete an operator (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses } },
  },
  '/api/v1/config/shifts': {
    get: { tags: ['Config'], summary: 'List shift definitions', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope({ type: 'array', items: ref('ShiftDefinition') as unknown as OpenAPIV3.SchemaObject })), ...errorResponses } },
    post: { tags: ['Config'], summary: 'Create a shift (admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, start_time: { type: 'string' }, end_time: { type: 'string' }, sort_order: { type: 'integer' } } } } } }, responses: { '201': createdJson(envelope(ref('ShiftDefinition'))), ...errorResponses } },
  },
  '/api/v1/config/shifts/{id}': {
    put: { tags: ['Config'], summary: 'Update a shift (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, start_time: { type: 'string' }, end_time: { type: 'string' }, sort_order: { type: 'integer' } } } } } }, responses: { '200': okJson(envelope(ref('ShiftDefinition'))), ...errorResponses } },
    delete: { tags: ['Config'], summary: 'Delete a shift (admin)', security: [{ bearerAuth: [] }], parameters: [idParam], responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses } },
  },

  // ── Analytics ──────────────────────────────────────────────────────
  '/api/v1/analytics/dashboard': {
    get: { tags: ['Analytics'], summary: 'Aggregate dashboard data (role level 2+)', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope(ref('DashboardData'))), ...errorResponses } },
  },
  '/api/v1/analytics/issues/breakdown': {
    get: { tags: ['Analytics'], summary: 'Issue category breakdown (role level 2+)', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope(ref('CategoryBreakdown'))), ...errorResponses } },
  },
  '/api/v1/analytics/issues/resolution-times': {
    get: {
      tags: ['Analytics'],
      summary: 'Resolution time statistics (role level 3+)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: { '200': okJson(envelope(ref('ResolutionTimes'))), ...errorResponses },
    },
  },
  '/api/v1/analytics/production/efficiency': {
    get: {
      tags: ['Analytics'],
      summary: 'Production efficiency analytics (role level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'workstation_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { '200': okJson(envelope(ref('ProductionEfficiency'))), ...errorResponses },
    },
  },
  '/api/v1/analytics/ai/query': {
    post: { tags: ['Analytics'], summary: 'AI-powered keyword search on issues (role level 2+)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('AiQueryRequest')), responses: { '200': okJson(envelope(ref('AiQueryResponse'))), ...errorResponses } },
  },
  '/api/v1/analytics/ai/report': {
    post: { tags: ['Analytics'], summary: 'Generate AI summary report (role level 3+)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('AiReportRequest')), responses: { '200': okJson(envelope(ref('AiReportResponse'))), ...errorResponses } },
  },

  // ── Handover ───────────────────────────────────────────────────────
  '/api/v1/handover/notes': {
    get: {
      tags: ['Handover'],
      summary: 'List handover notes',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'shift_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: { '200': okJson(envelope({ type: 'array', items: ref('HandoverNote') as unknown as OpenAPIV3.SchemaObject }, schemas.PaginationMeta)), ...errorResponses },
    },
    post: {
      tags: ['Handover'],
      summary: 'Create a handover note',
      security: [{ bearerAuth: [] }],
      requestBody: bodyJson(ref('CreateHandoverNoteRequest')),
      responses: { '201': createdJson(envelope(ref('HandoverNote'))), ...errorResponses },
    },
  },
  '/api/v1/handover/notes/current': {
    get: { tags: ['Handover'], summary: 'Get current shift handover notes', security: [{ bearerAuth: [] }], responses: { '200': okJson(envelope({ type: 'object', properties: { notes: { type: 'array', items: ref('HandoverNote') as unknown as OpenAPIV3.SchemaObject }, shift: ref('ShiftDefinition') as unknown as OpenAPIV3.SchemaObject, date: { type: 'string', format: 'date' } } })), ...errorResponses } },
  },
  '/api/v1/handover/notes/{id}': {
    put: { tags: ['Handover'], summary: 'Update a handover note', security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string' } } } } } }, responses: { '200': okJson(envelope(ref('HandoverNote'))), ...errorResponses } },
    delete: { tags: ['Handover'], summary: 'Delete a handover note (role level 2+)', security: [{ bearerAuth: [] }], parameters: [idParam], responses: { '200': okJson(envelope({ type: 'object', properties: { message: { type: 'string' } } })), ...errorResponses } },
  },

  // ── Bulk ───────────────────────────────────────────────────────────
  '/api/v1/bulk/issues/bulk-create': {
    post: { tags: ['Bulk Operations'], summary: 'Bulk create issues (admin)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('BulkCreateIssuesRequest')), responses: { '201': createdJson(envelope({ type: 'object', properties: { created: { type: 'integer' }, items: { type: 'array', items: ref('Issue') as unknown as OpenAPIV3.SchemaObject } } })), ...errorResponses } },
  },
  '/api/v1/bulk/issues/bulk-update': {
    post: { tags: ['Bulk Operations'], summary: 'Bulk update issues (admin)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('BulkUpdateIssuesRequest')), responses: { '200': okJson(envelope({ type: 'object', properties: { updated: { type: 'integer' } } })), ...errorResponses } },
  },
  '/api/v1/bulk/issues/bulk-delete': {
    post: { tags: ['Bulk Operations'], summary: 'Bulk delete issues with cascade (admin)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('BulkDeleteIssuesRequest')), responses: { '200': okJson(envelope({ type: 'object', properties: { deleted: { type: 'integer' } } })), ...errorResponses } },
  },
  '/api/v1/bulk/production/bulk-create': {
    post: { tags: ['Bulk Operations'], summary: 'Bulk create production entries (admin)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('BulkCreateProductionRequest')), responses: { '201': createdJson(envelope({ type: 'object', properties: { created: { type: 'integer' } } })), ...errorResponses } },
  },
  '/api/v1/bulk/safety/bulk-create': {
    post: { tags: ['Bulk Operations'], summary: 'Bulk create safety entries (admin)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('BulkCreateSafetyRequest')), responses: { '201': createdJson(envelope({ type: 'object', properties: { created: { type: 'integer' } } })), ...errorResponses } },
  },
  '/api/v1/bulk/config/bulk-import': {
    post: { tags: ['Bulk Operations'], summary: 'Bulk import config entities (admin)', security: [{ bearerAuth: [] }], requestBody: bodyJson(ref('BulkConfigImportRequest')), responses: { '201': createdJson(envelope({ type: 'object', properties: { entity: { type: 'string' }, imported: { type: 'integer' } } })), ...errorResponses } },
  },
  '/api/v1/bulk/export/issues': {
    get: { tags: ['Export'], summary: 'Export issues as JSON (role level 2+)', security: [{ bearerAuth: [] }], parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'level', in: 'query', schema: { type: 'integer' } }, { name: 'category_id', in: 'query', schema: { type: 'string', format: 'uuid' } }, { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } }], responses: { '200': okJson({ type: 'array', items: ref('Issue') as unknown as OpenAPIV3.SchemaObject }), ...errorResponses } },
  },
  '/api/v1/bulk/export/production': {
    get: { tags: ['Export'], summary: 'Export production entries as JSON (role level 2+)', security: [{ bearerAuth: [] }], parameters: [{ name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'workstation_id', in: 'query', schema: { type: 'string', format: 'uuid' } }], responses: { '200': okJson({ type: 'array', items: ref('ProductionEntry') as unknown as OpenAPIV3.SchemaObject }), ...errorResponses } },
  },
  '/api/v1/bulk/export/safety': {
    get: { tags: ['Export'], summary: 'Export safety entries as JSON (role level 2+)', security: [{ bearerAuth: [] }], parameters: [{ name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'team_id', in: 'query', schema: { type: 'string', format: 'uuid' } }], responses: { '200': okJson({ type: 'array', items: ref('SafetyEntry') as unknown as OpenAPIV3.SchemaObject }), ...errorResponses } },
  },
  '/api/v1/bulk/export/config': {
    get: { tags: ['Export'], summary: 'Export config entities as JSON (admin)', security: [{ bearerAuth: [] }], parameters: [{ name: 'entity', in: 'query', required: true, schema: { type: 'string', enum: ['workstations', 'categories', 'areas', 'teams', 'operators', 'shifts'] } }], responses: { '200': okJson({ type: 'array', items: { type: 'object' } }), ...errorResponses } },
  },
  '/api/v1/bulk/export/gemba-walks': {
    get: { tags: ['Export'], summary: 'Export gemba walks with findings (role level 2+)', security: [{ bearerAuth: [] }], parameters: [{ name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'status', in: 'query', schema: { type: 'string' } }], responses: { '200': okJson({ type: 'array', items: ref('GembaWalk') as unknown as OpenAPIV3.SchemaObject }), ...errorResponses } },
  },
};

// ---------------------------------------------------------------------------
// The full OpenAPI 3.0 spec
// ---------------------------------------------------------------------------
export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Gemba Management System API',
    version: '1.0.0',
    description:
      'REST API for the Gemba Management System. Handles issues, production tracking, safety entries, gemba walks, handover notes, analytics, and configuration management.\n\n' +
      '## Authentication\n' +
      'Most endpoints require a Bearer token obtained via `POST /api/v1/auth/login`. Include the token in the `Authorization` header:\n' +
      '```\nAuthorization: Bearer <access_token>\n```\n\n' +
      '## Role Levels\n' +
      '| Level | Role | Access |\n' +
      '|-------|------|--------|\n' +
      '| 1 | Team Member | Basic read/write |\n' +
      '| 2 | Area Leader | Stats, analytics |\n' +
      '| 3 | Plant Manager | Reports, AI |\n' +
      '| 99 | Admin | Full access, config |\n\n' +
      '## Response Envelope\n' +
      'All responses follow the format: `{ data, meta, errors }`',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Authentication', description: 'Login, logout, token refresh' },
    { name: 'Users', description: 'User management (admin only)' },
    { name: 'Issues', description: 'Issue tracking and lifecycle management' },
    { name: 'Production', description: 'Production entry tracking' },
    { name: 'Safety', description: 'Safety observation entries' },
    { name: 'Gemba Walks', description: 'Gemba walk management' },
    { name: 'Config', description: 'Configuration entities (workstations, areas, teams, etc.)' },
    { name: 'Analytics', description: 'Dashboard, efficiency, AI query and reports' },
    { name: 'Handover', description: 'Shift handover notes' },
    { name: 'Bulk Operations', description: 'Bulk create/update/delete operations (admin)' },
    { name: 'Export', description: 'Data export endpoints' },
  ],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from POST /api/v1/auth/login',
      },
    },
    schemas: schemas as Record<string, OpenAPIV3.SchemaObject>,
  },
};
