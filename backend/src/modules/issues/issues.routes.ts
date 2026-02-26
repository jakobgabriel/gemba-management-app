import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success, paginated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Generate a simple keyword-based AI suggestion for an issue.
 */
function generateAiSuggestion(title: string, description: string, category?: string): string {
  const text = `${title} ${description} ${category || ''}`.toLowerCase();

  if (text.includes('machine') || text.includes('equipment') || text.includes('breakdown')) {
    return 'Consider scheduling preventive maintenance and checking the equipment maintenance log for recurring issues. Verify that the maintenance checklist was followed during the last service.';
  }
  if (text.includes('quality') || text.includes('defect') || text.includes('reject')) {
    return 'Perform a root cause analysis using the 5-Why method. Check if standard operating procedures are being followed and verify incoming material quality.';
  }
  if (text.includes('safety') || text.includes('hazard') || text.includes('accident') || text.includes('injury')) {
    return 'Immediately secure the area and assess risk level. Conduct a safety audit and review PPE compliance. Update the risk assessment matrix accordingly.';
  }
  if (text.includes('delay') || text.includes('late') || text.includes('slow') || text.includes('bottleneck')) {
    return 'Analyze the production flow to identify bottlenecks. Consider implementing lean principles such as value stream mapping to optimize throughput.';
  }
  if (text.includes('material') || text.includes('supply') || text.includes('stock') || text.includes('inventory')) {
    return 'Review inventory levels and reorder points. Coordinate with the supply chain team to ensure material availability and consider safety stock adjustments.';
  }
  if (text.includes('training') || text.includes('skill') || text.includes('knowledge')) {
    return 'Identify skill gaps and schedule targeted training sessions. Consider implementing a mentoring program and updating training documentation.';
  }
  return 'Investigate the issue following standard problem-solving methodology. Document findings and engage the relevant team leads for a collaborative resolution.';
}

// GET / - List issues with filtering, pagination, sorting
router.get('/', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      status,
      level,
      category_id,
      priority,
      area_id,
      search,
      from_date,
      to_date,
      page = '1',
      per_page = '20',
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(per_page as string, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`i.status = $${paramIndex++}`);
      params.push(status);
    }
    if (level) {
      conditions.push(`i.level = $${paramIndex++}`);
      params.push(parseInt(level as string, 10));
    }
    if (category_id) {
      conditions.push(`i.category_id = $${paramIndex++}`);
      params.push(category_id);
    }
    if (priority) {
      conditions.push(`i.priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (area_id) {
      conditions.push(`i.area_id = $${paramIndex++}`);
      params.push(area_id);
    }
    if (search) {
      conditions.push(`(i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (from_date) {
      conditions.push(`i.created_at >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`i.created_at <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields: Record<string, string> = {
      created_at: 'i.created_at',
      updated_at: 'i.updated_at',
      priority: 'i.priority',
      level: 'i.level',
      status: 'i.status',
      title: 'i.title',
    };
    const sortField = allowedSortFields[sort_by as string] || 'i.created_at';
    const order = (sort_order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM gemba.issues i ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Data query
    const dataResult = await query(
      `SELECT i.id, i.title, i.description, i.status, i.level, i.priority,
              i.category_id, c.name AS category_name,
              i.area_id, a.name AS area_name,
              i.source, i.created_by, i.created_at, i.updated_at
       FROM gemba.issues i
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       LEFT JOIN gemba_config.areas a ON i.area_id = a.id
       ${whereClause}
       ORDER BY ${sortField} ${order}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, perPage, offset],
    );

    res.json(paginated(dataResult.rows, pageNum, perPage, total));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// GET /stats - Issue statistics
router.get('/stats', requireRole(2), async (_req: Request, res: Response) => {
  try {
    const totalResult = await query('SELECT COUNT(*) AS total FROM gemba.issues');
    const byStatusResult = await query(
      `SELECT status, COUNT(*) AS count FROM gemba.issues GROUP BY status ORDER BY status`,
    );
    const byLevelResult = await query(
      `SELECT level, COUNT(*) AS count FROM gemba.issues GROUP BY level ORDER BY level`,
    );
    const byCategoryResult = await query(
      `SELECT c.name AS category, COUNT(*) AS count
       FROM gemba.issues i
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       GROUP BY c.name ORDER BY count DESC`,
    );

    res.json(success({
      total: parseInt(totalResult.rows[0].total, 10),
      by_status: byStatusResult.rows.map((r) => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
      by_level: byLevelResult.rows.map((r) => ({
        level: r.level,
        count: parseInt(r.count, 10),
      })),
      by_category: byCategoryResult.rows.map((r) => ({
        category: r.category,
        count: parseInt(r.count, 10),
      })),
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// GET /:id - Get single issue
router.get('/:id', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT i.id, i.title, i.description, i.status, i.level, i.priority,
              i.category_id, c.name AS category_name,
              i.area_id, a.name AS area_name,
              i.source, i.created_by,
              u.username AS created_by_username, u.display_name AS created_by_name,
              i.created_at, i.updated_at
       FROM gemba.issues i
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       LEFT JOIN gemba_config.areas a ON i.area_id = a.id
       LEFT JOIN gemba_config.users u ON i.created_by = u.id
       WHERE i.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Issue not found');
    }

    res.json(success(result.rows[0]));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// POST / - Create issue
router.post('/', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category_id,
      area_id,
      priority = 'MEDIUM',
      level = 1,
      source = 'manual',
    } = req.body;

    if (!title) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Title is required');
    }

    const issueId = uuidv4();
    const issueResult = await query(
      `INSERT INTO gemba.issues (id, issue_number, title, description, category_id, area_id, priority, level, source, status, created_by, created_at, updated_at)
       VALUES ($1, nextval('gemba.issue_number_seq'), $2, $3, $4, $5, $6, $7, $8, 'OPEN', $9, NOW(), NOW())
       RETURNING *`,
      [issueId, title, description || null, category_id || null, area_id || null, priority, level, source, req.user!.id],
    );

    // Fetch category name for AI suggestion context
    let categoryName: string | undefined;
    if (category_id) {
      const catResult = await query('SELECT name FROM gemba_config.issue_categories WHERE id = $1', [category_id]);
      if (catResult.rows.length > 0) {
        categoryName = catResult.rows[0].name;
      }
    }

    // Generate and store AI suggestion
    const suggestionText = generateAiSuggestion(title, description || '', categoryName);
    const suggestionId = uuidv4();
    await query(
      `INSERT INTO gemba.ai_suggestions (id, issue_id, suggested_level, reason, confidence, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [suggestionId, issueId, level, suggestionText, 0.75],
    );

    res.status(201).json(success({
      ...issueResult.rows[0],
      ai_suggestion: {
        id: suggestionId,
        suggested_level: level,
        reason: suggestionText,
        confidence: 0.75,
      },
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// PUT /:id - Update issue
router.put('/:id', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, area_id, priority, status, level } = req.body;

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      params.push(category_id);
    }
    if (area_id !== undefined) {
      updates.push(`area_id = $${paramIndex++}`);
      params.push(area_id);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (level !== undefined) {
      updates.push(`level = $${paramIndex++}`);
      params.push(level);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE gemba.issues SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Issue not found');
    }

    res.json(success(result.rows[0]));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// POST /:id/escalate - Escalate issue
router.post('/:id/escalate', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_level, reason } = req.body;

    if (!target_level || !reason) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Target level and reason are required');
    }

    // Get current issue
    const issueResult = await query('SELECT * FROM gemba.issues WHERE id = $1', [id]);
    if (issueResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Issue not found');
    }

    const issue = issueResult.rows[0];

    if (target_level <= issue.level) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Target level must be higher than current level');
    }

    // Update issue
    const updatedIssue = await query(
      `UPDATE gemba.issues SET level = $1, status = 'ESCALATED', updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [target_level, id],
    );

    // Insert escalation record
    const escalationId = uuidv4();
    await query(
      `INSERT INTO gemba.issue_escalations (id, issue_id, from_level, to_level, reason, escalated_by, escalated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [escalationId, id, issue.level, target_level, reason, req.user!.id],
    );

    res.json(success({
      issue: updatedIssue.rows[0],
      escalation: {
        id: escalationId,
        from_level: issue.level,
        to_level: target_level,
        reason,
      },
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// POST /:id/resolve - Resolve issue
router.post('/:id/resolve', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution, downtime_prevented, defects_reduced, cost_savings } = req.body;

    if (!resolution) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Resolution is required');
    }

    // Verify issue exists
    const issueResult = await query('SELECT * FROM gemba.issues WHERE id = $1', [id]);
    if (issueResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Issue not found');
    }

    // Update issue status
    const updatedIssue = await query(
      `UPDATE gemba.issues SET status = 'RESOLVED', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );

    // Insert resolution record
    const resolutionId = uuidv4();
    await query(
      `INSERT INTO gemba.issue_resolutions (id, issue_id, resolution, resolved_by, resolved_at, downtime_prevented, defects_reduced, cost_savings)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)`,
      [resolutionId, id, resolution, req.user!.id, downtime_prevented || null, defects_reduced || null, cost_savings || null],
    );

    res.json(success({
      issue: updatedIssue.rows[0],
      resolution: {
        id: resolutionId,
        resolution,
        downtime_prevented,
        defects_reduced,
        cost_savings,
      },
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// DELETE /:id - Delete issue and related records (admin only)
router.delete('/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify issue exists
    const issueResult = await query('SELECT id FROM gemba.issues WHERE id = $1', [id]);
    if (issueResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Issue not found');
    }

    // Delete related escalations
    await query('DELETE FROM gemba.issue_escalations WHERE issue_id = $1', [id]);

    // Delete related resolutions
    await query('DELETE FROM gemba.issue_resolutions WHERE issue_id = $1', [id]);

    // Delete related AI suggestions
    await query('DELETE FROM gemba.ai_suggestions WHERE issue_id = $1', [id]);

    // Delete the issue
    await query('DELETE FROM gemba.issues WHERE id = $1', [id]);

    res.json(success({ message: 'Issue deleted successfully' }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// GET /:id/history - Get escalations and resolution for an issue
router.get('/:id/history', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify issue exists
    const issueResult = await query('SELECT id FROM gemba.issues WHERE id = $1', [id]);
    if (issueResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Issue not found');
    }

    const escalations = await query(
      `SELECT e.id, e.from_level, e.to_level, e.reason, e.escalated_at,
              u.username AS escalated_by_username, u.display_name AS escalated_by_name
       FROM gemba.issue_escalations e
       LEFT JOIN gemba_config.users u ON e.escalated_by = u.id
       WHERE e.issue_id = $1
       ORDER BY e.escalated_at ASC`,
      [id],
    );

    const resolution = await query(
      `SELECT r.id, r.resolution, r.resolved_by, r.resolved_at,
              r.downtime_prevented, r.defects_reduced, r.cost_savings,
              u.username AS resolved_by_username, u.display_name AS resolved_by_name
       FROM gemba.issue_resolutions r
       LEFT JOIN gemba_config.users u ON r.resolved_by = u.id
       WHERE r.issue_id = $1`,
      [id],
    );

    res.json(success({
      escalations: escalations.rows,
      resolution: resolution.rows.length > 0 ? resolution.rows[0] : null,
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

export default router;
