import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success, paginated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /notes - Get handover notes with filters
router.get('/notes', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      date,
      shift_id,
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

    if (date) {
      conditions.push(`hn.note_date = $${paramIndex++}`);
      params.push(date);
    }
    if (shift_id) {
      conditions.push(`hn.shift_id = $${paramIndex++}`);
      params.push(shift_id);
    }
    if (from_date) {
      conditions.push(`hn.note_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`hn.note_date <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM gemba.shift_handover_notes hn ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await query(
      `SELECT hn.id, hn.note_date, hn.shift_id, s.name AS shift_name,
              hn.content, hn.created_by, u.display_name AS created_by_name,
              hn.created_at, hn.updated_at
       FROM gemba.shift_handover_notes hn
       LEFT JOIN gemba_config.shift_definitions s ON hn.shift_id = s.id
       LEFT JOIN gemba_config.users u ON hn.created_by = u.id
       ${whereClause}
       ORDER BY hn.note_date DESC, hn.created_at DESC
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

// POST /notes - Create handover note
router.post('/notes', requireRole(1), async (req: Request, res: Response) => {
  try {
    const {
      note_date,
      shift_id,
      content,
    } = req.body;

    if (!note_date || !shift_id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'note_date and shift_id are required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.shift_handover_notes
        (id, plant_id, shift_id, note_date, content, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        id,
        req.user!.plantId,
        shift_id,
        note_date,
        content || null,
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

// PUT /notes/:id - Update handover note
router.put('/notes/:id', requireRole(1), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (content === undefined) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    const result = await query(
      `UPDATE gemba.shift_handover_notes SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [content, id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Handover note not found');
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

// DELETE /notes/:id - Delete handover note
router.delete('/notes/:id', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM gemba.shift_handover_notes WHERE id = $1 RETURNING id',
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Handover note not found');
    }

    res.json(success({ message: 'Handover note deleted successfully' }));
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

// GET /notes/current - Get current shift's notes
router.get('/notes/current', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // Determine current shift based on time of day
    // Try to find a shift that covers the current hour
    const shiftResult = await query(
      `SELECT id, name, start_time, end_time
       FROM gemba_config.shift_definitions
       WHERE is_active = true
       ORDER BY start_time ASC`,
    );

    let currentShiftId: string | null = null;

    for (const shift of shiftResult.rows) {
      const startHour = parseInt(shift.start_time.split(':')[0], 10);
      const endHour = parseInt(shift.end_time.split(':')[0], 10);

      if (endHour > startHour) {
        // Normal shift (e.g., 06:00 - 14:00)
        if (currentHour >= startHour && currentHour < endHour) {
          currentShiftId = shift.id;
          break;
        }
      } else {
        // Overnight shift (e.g., 22:00 - 06:00)
        if (currentHour >= startHour || currentHour < endHour) {
          currentShiftId = shift.id;
          break;
        }
      }
    }

    // If no shift matches, use the first active shift
    if (!currentShiftId && shiftResult.rows.length > 0) {
      currentShiftId = shiftResult.rows[0].id;
    }

    if (!currentShiftId) {
      res.json(success({
        notes: [],
        shift: null,
        date: today,
      }));
      return;
    }

    const notesResult = await query(
      `SELECT hn.id, hn.note_date, hn.shift_id, s.name AS shift_name,
              hn.content, hn.created_by, u.display_name AS created_by_name,
              hn.created_at, hn.updated_at
       FROM gemba.shift_handover_notes hn
       LEFT JOIN gemba_config.shift_definitions s ON hn.shift_id = s.id
       LEFT JOIN gemba_config.users u ON hn.created_by = u.id
       WHERE hn.note_date = $1 AND hn.shift_id = $2
       ORDER BY hn.created_at DESC`,
      [today, currentShiftId],
    );

    const currentShift = shiftResult.rows.find((s) => s.id === currentShiftId);

    res.json(success({
      notes: notesResult.rows,
      shift: currentShift || null,
      date: today,
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
