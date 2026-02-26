import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success, paginated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET / - List gemba walks with pagination
router.get('/', requireRole(2), async (req: Request, res: Response) => {
  try {
    const {
      status,
      from_date,
      to_date,
      page = '1',
      per_page = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(per_page as string, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`gw.status = $${paramIndex++}`);
      params.push(status);
    }
    if (from_date) {
      conditions.push(`gw.started_at >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`gw.started_at <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM gemba.gemba_walks gw ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await query(
      `SELECT gw.id, gw.status, gw.target_areas, gw.focus, gw.participants,
              gw.current_step, gw.team_feedback, gw.duration_min,
              gw.leader_id, u.username AS leader_username, u.display_name AS leader_name,
              gw.started_at, gw.completed_at
       FROM gemba.gemba_walks gw
       LEFT JOIN gemba_config.users u ON gw.leader_id = u.id
       ${whereClause}
       ORDER BY gw.started_at DESC
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

// GET /:id - Get walk with findings and issues
router.get('/:id', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const walkResult = await query(
      `SELECT gw.id, gw.status, gw.target_areas, gw.focus, gw.participants,
              gw.current_step, gw.team_feedback, gw.duration_min,
              gw.leader_id, u.username AS leader_username, u.display_name AS leader_name,
              gw.started_at, gw.completed_at
       FROM gemba.gemba_walks gw
       LEFT JOIN gemba_config.users u ON gw.leader_id = u.id
       WHERE gw.id = $1`,
      [id],
    );

    if (walkResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Gemba walk not found');
    }

    const findingsResult = await query(
      `SELECT gf.id, gf.observation, gf.finding_type, gf.area_id,
              a.name AS area_name, gf.created_at
       FROM gemba.gemba_walk_findings gf
       LEFT JOIN gemba_config.areas a ON gf.area_id = a.id
       WHERE gf.walk_id = $1
       ORDER BY gf.created_at ASC`,
      [id],
    );

    const issuesResult = await query(
      `SELECT i.id, i.title, i.status, i.level, i.priority, i.created_at
       FROM gemba.issues i
       WHERE i.source = 'gemba' AND i.walk_id = $1
       ORDER BY i.created_at ASC`,
      [id],
    );

    res.json(success({
      ...walkResult.rows[0],
      findings: findingsResult.rows,
      issues: issuesResult.rows,
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

// POST / - Start new gemba walk
router.post('/', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { target_areas, focus, participants } = req.body;

    if (!focus) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Focus is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.gemba_walks
        (id, status, target_areas, focus, participants, current_step, leader_id, started_at)
       VALUES ($1, 'in_progress', $2, $3, $4, 1, $5, NOW())
       RETURNING *`,
      [id, JSON.stringify(target_areas || []), focus, JSON.stringify(participants || []), req.user!.id],
    );

    res.status(201).json(success(result.rows[0]));
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

// PUT /:id - Update walk (step progression, add team_feedback)
router.put('/:id', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { current_step, team_feedback, focus, target_areas, participants } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (current_step !== undefined) {
      updates.push(`current_step = $${paramIndex++}`);
      params.push(current_step);
    }
    if (team_feedback !== undefined) {
      updates.push(`team_feedback = $${paramIndex++}`);
      params.push(team_feedback);
    }
    if (focus !== undefined) {
      updates.push(`focus = $${paramIndex++}`);
      params.push(focus);
    }
    if (target_areas !== undefined) {
      updates.push(`target_areas = $${paramIndex++}`);
      params.push(JSON.stringify(target_areas));
    }
    if (participants !== undefined) {
      updates.push(`participants = $${paramIndex++}`);
      params.push(JSON.stringify(participants));
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    params.push(id);

    const result = await query(
      `UPDATE gemba.gemba_walks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Gemba walk not found');
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

// POST /:id/complete - Complete walk
router.post('/:id/complete', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { duration_min } = req.body;

    const walkResult = await query(
      `SELECT * FROM gemba.gemba_walks WHERE id = $1`,
      [id],
    );

    if (walkResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Gemba walk not found');
    }

    if (walkResult.rows[0].status === 'completed') {
      throw new AppError(400, 'ALREADY_COMPLETED', 'This gemba walk is already completed');
    }

    // Calculate duration if not provided
    let finalDuration = duration_min;
    if (!finalDuration) {
      const createdAt = new Date(walkResult.rows[0].started_at);
      const now = new Date();
      finalDuration = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60));
    }

    const result = await query(
      `UPDATE gemba.gemba_walks
       SET status = 'completed', completed_at = NOW(), duration_min = $1
       WHERE id = $2
       RETURNING *`,
      [finalDuration, id],
    );

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

// POST /:id/findings - Add finding to walk
router.post('/:id/findings', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id: walkId } = req.params;
    const { observation, finding_type, area_id } = req.body;

    if (!observation) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Observation is required');
    }

    // Verify walk exists and is in progress
    const walkResult = await query(
      `SELECT id, status FROM gemba.gemba_walks WHERE id = $1`,
      [walkId],
    );

    if (walkResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Gemba walk not found');
    }

    if (walkResult.rows[0].status === 'completed') {
      throw new AppError(400, 'WALK_COMPLETED', 'Cannot add findings to a completed walk');
    }

    const findingId = uuidv4();
    const result = await query(
      `INSERT INTO gemba.gemba_walk_findings
        (id, walk_id, observation, finding_type, area_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [findingId, walkId, observation, finding_type || 'observation', area_id || null],
    );

    res.status(201).json(success(result.rows[0]));
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

// POST /:id/issues - Create issue from walk finding
router.post('/:id/issues', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id: walkId } = req.params;
    const {
      title,
      description,
      category_id,
      area_id,
      priority = 'MEDIUM',
      level = 1,
      finding_id,
    } = req.body;

    if (!title) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Title is required');
    }

    // Verify walk exists
    const walkResult = await query(
      `SELECT id FROM gemba.gemba_walks WHERE id = $1`,
      [walkId],
    );

    if (walkResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Gemba walk not found');
    }

    const issueId = uuidv4();
    const result = await query(
      `INSERT INTO gemba.issues
        (id, title, description, category_id, area_id, priority, level, source, walk_id, finding_id, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'gemba', $8, $9, 'OPEN', $10, NOW(), NOW())
       RETURNING *`,
      [issueId, title, description || null, category_id || null, area_id || null, priority, level, walkId, finding_id || null, req.user!.id],
    );

    res.status(201).json(success(result.rows[0]));
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
