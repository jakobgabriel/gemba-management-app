import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success, paginated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /entries - List production entries with filters
router.get('/entries', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      workstation_id,
      shift_id,
      date,
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

    if (workstation_id) {
      conditions.push(`pe.workstation_id = $${paramIndex++}`);
      params.push(workstation_id);
    }
    if (shift_id) {
      conditions.push(`pe.shift_id = $${paramIndex++}`);
      params.push(shift_id);
    }
    if (date) {
      conditions.push(`pe.production_date = $${paramIndex++}`);
      params.push(date);
    }
    if (from_date) {
      conditions.push(`pe.production_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`pe.production_date <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM gemba.production_entries pe ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await query(
      `SELECT pe.id, pe.workstation_id, w.name AS workstation_name,
              pe.shift_id, s.name AS shift_name,
              pe.production_date, pe.hour_slot, pe.target_qty, pe.actual_qty,
              pe.reject_qty, pe.downtime_minutes, pe.notes,
              pe.created_by, pe.created_at, pe.updated_at
       FROM gemba.production_entries pe
       LEFT JOIN gemba.workstations w ON pe.workstation_id = w.id
       LEFT JOIN gemba.shifts s ON pe.shift_id = s.id
       ${whereClause}
       ORDER BY pe.production_date DESC, pe.hour_slot ASC
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

// POST /entries - Create/upsert hourly production entry
router.post('/entries', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      workstation_id,
      shift_id,
      production_date,
      hour_slot,
      target_qty,
      actual_qty,
      reject_qty = 0,
      downtime_minutes = 0,
      notes,
    } = req.body;

    if (!workstation_id || !shift_id || !production_date || hour_slot === undefined || target_qty === undefined || actual_qty === undefined) {
      throw new AppError(400, 'VALIDATION_ERROR', 'workstation_id, shift_id, production_date, hour_slot, target_qty, and actual_qty are required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.production_entries
        (id, workstation_id, shift_id, production_date, hour_slot, target_qty, actual_qty, reject_qty, downtime_minutes, notes, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (workstation_id, shift_id, production_date, hour_slot)
       DO UPDATE SET
         target_qty = EXCLUDED.target_qty,
         actual_qty = EXCLUDED.actual_qty,
         reject_qty = EXCLUDED.reject_qty,
         downtime_minutes = EXCLUDED.downtime_minutes,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [id, workstation_id, shift_id, production_date, hour_slot, target_qty, actual_qty, reject_qty, downtime_minutes, notes || null, req.user!.id],
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

// PUT /entries/:id - Update production entry
router.put('/entries/:id', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_qty, actual_qty, reject_qty, downtime_minutes, notes } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (target_qty !== undefined) {
      updates.push(`target_qty = $${paramIndex++}`);
      params.push(target_qty);
    }
    if (actual_qty !== undefined) {
      updates.push(`actual_qty = $${paramIndex++}`);
      params.push(actual_qty);
    }
    if (reject_qty !== undefined) {
      updates.push(`reject_qty = $${paramIndex++}`);
      params.push(reject_qty);
    }
    if (downtime_minutes !== undefined) {
      updates.push(`downtime_minutes = $${paramIndex++}`);
      params.push(downtime_minutes);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE gemba.production_entries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Production entry not found');
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

// DELETE /entries/:id - Delete production entry
router.delete('/entries/:id', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM gemba.production_entries WHERE id = $1 RETURNING id',
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Production entry not found');
    }

    res.json(success({ message: 'Production entry deleted successfully' }));
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

// GET /summary - Production summary with efficiency
router.get('/summary', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, shift_id, workstation_id } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`pe.production_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`pe.production_date <= $${paramIndex++}`);
      params.push(to_date);
    }
    if (shift_id) {
      conditions.push(`pe.shift_id = $${paramIndex++}`);
      params.push(shift_id);
    }
    if (workstation_id) {
      conditions.push(`pe.workstation_id = $${paramIndex++}`);
      params.push(workstation_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Overall summary
    const overallResult = await query(
      `SELECT
         SUM(pe.target_qty) AS total_target,
         SUM(pe.actual_qty) AS total_actual,
         SUM(pe.reject_qty) AS total_rejects,
         SUM(pe.downtime_minutes) AS total_downtime,
         CASE WHEN SUM(pe.target_qty) > 0
           THEN ROUND((SUM(pe.actual_qty)::numeric / SUM(pe.target_qty)::numeric) * 100, 2)
           ELSE 0
         END AS efficiency_pct
       FROM gemba.production_entries pe
       ${whereClause}`,
      params,
    );

    // Daily breakdown
    const dailyResult = await query(
      `SELECT
         pe.production_date,
         SUM(pe.target_qty) AS target,
         SUM(pe.actual_qty) AS actual,
         SUM(pe.reject_qty) AS rejects,
         CASE WHEN SUM(pe.target_qty) > 0
           THEN ROUND((SUM(pe.actual_qty)::numeric / SUM(pe.target_qty)::numeric) * 100, 2)
           ELSE 0
         END AS efficiency_pct
       FROM gemba.production_entries pe
       ${whereClause}
       GROUP BY pe.production_date
       ORDER BY pe.production_date DESC`,
      params,
    );

    // By shift breakdown
    const byShiftResult = await query(
      `SELECT
         s.name AS shift_name,
         SUM(pe.target_qty) AS target,
         SUM(pe.actual_qty) AS actual,
         CASE WHEN SUM(pe.target_qty) > 0
           THEN ROUND((SUM(pe.actual_qty)::numeric / SUM(pe.target_qty)::numeric) * 100, 2)
           ELSE 0
         END AS efficiency_pct
       FROM gemba.production_entries pe
       LEFT JOIN gemba.shifts s ON pe.shift_id = s.id
       ${whereClause}
       GROUP BY s.name
       ORDER BY s.name`,
      params,
    );

    const overall = overallResult.rows[0];

    res.json(success({
      overall: {
        total_target: parseInt(overall.total_target, 10) || 0,
        total_actual: parseInt(overall.total_actual, 10) || 0,
        total_rejects: parseInt(overall.total_rejects, 10) || 0,
        total_downtime: parseInt(overall.total_downtime, 10) || 0,
        efficiency_pct: parseFloat(overall.efficiency_pct) || 0,
      },
      daily: dailyResult.rows.map((r) => ({
        production_date: r.production_date,
        target: parseInt(r.target, 10),
        actual: parseInt(r.actual, 10),
        rejects: parseInt(r.rejects, 10),
        efficiency_pct: parseFloat(r.efficiency_pct),
      })),
      by_shift: byShiftResult.rows.map((r) => ({
        shift_name: r.shift_name,
        target: parseInt(r.target, 10),
        actual: parseInt(r.actual, 10),
        efficiency_pct: parseFloat(r.efficiency_pct),
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

export default router;
