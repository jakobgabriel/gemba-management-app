import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success, paginated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET / - List production entries with filters & pagination
router.get('/', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      workstation_id,
      shift_id,
      entry_date,
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
    if (entry_date) {
      conditions.push(`pe.entry_date = $${paramIndex++}`);
      params.push(entry_date);
    }
    if (from_date) {
      conditions.push(`pe.entry_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`pe.entry_date <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM gemba.production_entries pe ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await query(
      `SELECT pe.id, pe.workstation_id, w.machine_code, w.name AS workstation_name,
              pe.shift_id, s.name AS shift_name,
              pe.entry_date, pe.hour,
              pe.target, pe.actual,
              pe.part_number, pe.notes,
              pe.created_by, pe.created_at
       FROM gemba.production_entries pe
       LEFT JOIN gemba_config.workstations w ON pe.workstation_id = w.id
       LEFT JOIN gemba_config.shift_definitions s ON pe.shift_id = s.id
       ${whereClause}
       ORDER BY pe.entry_date DESC, pe.hour DESC
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

// GET /by-workstation/:workstationId - Get production data for a workstation
router.get('/by-workstation/:workstationId', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { workstationId } = req.params;
    const { date, shift_id } = req.query;

    const conditions: string[] = ['pe.workstation_id = $1'];
    const params: unknown[] = [workstationId];
    let paramIndex = 2;

    if (date) {
      conditions.push(`pe.entry_date = $${paramIndex++}`);
      params.push(date);
    }
    if (shift_id) {
      conditions.push(`pe.shift_id = $${paramIndex++}`);
      params.push(shift_id);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT pe.id, pe.entry_date, pe.hour,
              pe.target, pe.actual,
              pe.part_number, pe.notes
       FROM gemba.production_entries pe
       ${whereClause}
       ORDER BY pe.entry_date ASC, pe.hour ASC`,
      params,
    );

    // Compute summary
    const entries = result.rows;
    const totalTarget = entries.reduce((sum: number, e: any) => sum + (parseInt(e.target, 10) || 0), 0);
    const totalActual = entries.reduce((sum: number, e: any) => sum + (parseInt(e.actual, 10) || 0), 0);
    const efficiency = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 10000) / 100 : 0;

    res.json(success({
      workstation_id: workstationId,
      entries,
      summary: {
        total_target: totalTarget,
        total_actual: totalActual,
        efficiency_pct: efficiency,
        entries_count: entries.length,
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

// POST / - Create or update a production entry (upsert)
router.post('/', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      workstation_id,
      shift_id,
      entry_date,
      hour,
      target,
      actual,
      part_number,
      notes,
    } = req.body;

    if (!workstation_id || !shift_id || !entry_date || hour === undefined) {
      throw new AppError(400, 'VALIDATION_ERROR', 'workstation_id, shift_id, entry_date, and hour are required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.production_entries
        (id, plant_id, workstation_id, shift_id, entry_date, hour, target, actual, part_number, notes, created_by, created_at)
       VALUES ($1,
        (SELECT plant_id FROM gemba_config.workstations WHERE id = $2),
        $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (workstation_id, entry_date, hour)
       DO UPDATE SET target = EXCLUDED.target, actual = EXCLUDED.actual,
                     part_number = EXCLUDED.part_number, notes = EXCLUDED.notes
       RETURNING *`,
      [
        id,
        workstation_id,
        shift_id,
        entry_date,
        hour,
        target || 0,
        actual || 0,
        part_number || null,
        notes || null,
        req.user!.id,
      ],
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

// PUT /:id - Update a production entry
router.put('/:id', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target, actual, part_number, notes } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (target !== undefined) {
      updates.push(`target = $${paramIndex++}`);
      params.push(target);
    }
    if (actual !== undefined) {
      updates.push(`actual = $${paramIndex++}`);
      params.push(actual);
    }
    if (part_number !== undefined) {
      updates.push(`part_number = $${paramIndex++}`);
      params.push(part_number);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

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

// DELETE /:id - Delete a production entry
router.delete('/:id', requireRole(2), async (req: Request, res: Response) => {
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

export default router;
