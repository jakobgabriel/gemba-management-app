import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success, paginated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /entries - List safety entries with filters
router.get('/entries', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      from_date,
      to_date,
      team_id,
      area_id,
      status,
      page = '1',
      per_page = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(per_page as string, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`se.entry_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`se.entry_date <= $${paramIndex++}`);
      params.push(to_date);
    }
    if (team_id) {
      conditions.push(`se.team_id = $${paramIndex++}`);
      params.push(team_id);
    }
    if (area_id) {
      conditions.push(`se.area_id = $${paramIndex++}`);
      params.push(area_id);
    }
    if (status) {
      conditions.push(`se.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM gemba.safety_entries se ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await query(
      `SELECT se.id, se.entry_date, se.team_id, t.name AS team_name,
              se.area_id, a.name AS area_name,
              se.status, se.observation_type, se.description,
              se.corrective_action, se.risk_level,
              se.created_by, se.created_at, se.updated_at
       FROM gemba.safety_entries se
       LEFT JOIN gemba.teams t ON se.team_id = t.id
       LEFT JOIN gemba.areas a ON se.area_id = a.id
       ${whereClause}
       ORDER BY se.entry_date DESC, se.created_at DESC
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

// POST /entries - Create safety entry (upsert on unique constraint)
router.post('/entries', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      entry_date,
      team_id,
      area_id,
      status = 'SAFE',
      observation_type,
      description,
      corrective_action,
      risk_level = 'LOW',
    } = req.body;

    if (!entry_date || !area_id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'entry_date and area_id are required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.safety_entries
        (id, entry_date, team_id, area_id, status, observation_type, description, corrective_action, risk_level, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT (entry_date, area_id, team_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         observation_type = EXCLUDED.observation_type,
         description = EXCLUDED.description,
         corrective_action = EXCLUDED.corrective_action,
         risk_level = EXCLUDED.risk_level,
         updated_at = NOW()
       RETURNING *`,
      [id, entry_date, team_id || null, area_id, status, observation_type || null, description || null, corrective_action || null, risk_level, req.user!.id],
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

// PUT /entries/:id - Update safety entry
router.put('/entries/:id', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, observation_type, description, corrective_action, risk_level } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (observation_type !== undefined) {
      updates.push(`observation_type = $${paramIndex++}`);
      params.push(observation_type);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (corrective_action !== undefined) {
      updates.push(`corrective_action = $${paramIndex++}`);
      params.push(corrective_action);
    }
    if (risk_level !== undefined) {
      updates.push(`risk_level = $${paramIndex++}`);
      params.push(risk_level);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE gemba.safety_entries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Safety entry not found');
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

// DELETE /entries/:id - Delete safety entry
router.delete('/entries/:id', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM gemba.safety_entries WHERE id = $1 RETURNING id',
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Safety entry not found');
    }

    res.json(success({ message: 'Safety entry deleted successfully' }));
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

// GET /stats - Safety statistics
router.get('/stats', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { from_date, to_date } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`se.entry_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`se.entry_date <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Counts by status
    const byStatusResult = await query(
      `SELECT se.status, COUNT(*) AS count
       FROM gemba.safety_entries se
       ${whereClause}
       GROUP BY se.status
       ORDER BY se.status`,
      params,
    );

    // Counts by risk level
    const byRiskResult = await query(
      `SELECT se.risk_level, COUNT(*) AS count
       FROM gemba.safety_entries se
       ${whereClause}
       GROUP BY se.risk_level
       ORDER BY se.risk_level`,
      params,
    );

    // Monthly trend
    const monthlyResult = await query(
      `SELECT
         TO_CHAR(se.entry_date, 'YYYY-MM') AS month,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE se.status = 'INCIDENT') AS incidents,
         COUNT(*) FILTER (WHERE se.status = 'NEAR_MISS') AS near_misses,
         COUNT(*) FILTER (WHERE se.status = 'SAFE') AS safe_observations
       FROM gemba.safety_entries se
       ${whereClause}
       GROUP BY TO_CHAR(se.entry_date, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
      params,
    );

    const totalResult = await query(
      `SELECT COUNT(*) AS total FROM gemba.safety_entries se ${whereClause}`,
      params,
    );

    res.json(success({
      total: parseInt(totalResult.rows[0].total, 10),
      by_status: byStatusResult.rows.map((r) => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
      by_risk_level: byRiskResult.rows.map((r) => ({
        risk_level: r.risk_level,
        count: parseInt(r.count, 10),
      })),
      monthly_trend: monthlyResult.rows.map((r) => ({
        month: r.month,
        total: parseInt(r.total, 10),
        incidents: parseInt(r.incidents, 10),
        near_misses: parseInt(r.near_misses, 10),
        safe_observations: parseInt(r.safe_observations, 10),
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

// GET /days-without-accident - Calculate days since last incident
router.get('/days-without-accident', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT MAX(se.entry_date) AS last_incident_date
       FROM gemba.safety_entries se
       WHERE se.status = 'INCIDENT'`,
    );

    const lastIncidentDate = result.rows[0]?.last_incident_date;

    let days_without_accident: number;
    if (lastIncidentDate) {
      const lastDate = new Date(lastIncidentDate);
      const today = new Date();
      const diffTime = today.getTime() - lastDate.getTime();
      days_without_accident = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // No incidents recorded; return days since earliest safety entry or 0
      const earliestResult = await query(
        `SELECT MIN(se.entry_date) AS earliest_date FROM gemba.safety_entries se`,
      );
      const earliest = earliestResult.rows[0]?.earliest_date;
      if (earliest) {
        const earliestDate = new Date(earliest);
        const today = new Date();
        const diffTime = today.getTime() - earliestDate.getTime();
        days_without_accident = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      } else {
        days_without_accident = 0;
      }
    }

    res.json(success({
      days_without_accident,
      last_incident_date: lastIncidentDate || null,
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
