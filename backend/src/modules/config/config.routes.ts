import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── WORKSTATIONS ────────────────────────────────────────────────────────────

// GET /workstations
router.get('/workstations', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, code, area_id, is_active, created_at, updated_at
       FROM gemba.workstations
       ORDER BY name ASC`,
    );
    res.json(success(result.rows));
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

// POST /workstations (admin)
router.post('/workstations', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { name, code, area_id, is_active = true } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Workstation name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.workstations (id, name, code, area_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [id, name, code || null, area_id || null, is_active],
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

// PUT /workstations/:id (admin)
router.put('/workstations/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, area_id, is_active } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (code !== undefined) {
      updates.push(`code = $${paramIndex++}`);
      params.push(code);
    }
    if (area_id !== undefined) {
      updates.push(`area_id = $${paramIndex++}`);
      params.push(area_id);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE gemba.workstations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Workstation not found');
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

// DELETE /workstations/:id (admin)
router.delete('/workstations/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba.workstations WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Workstation not found');
    }

    res.json(success({ message: 'Workstation deleted successfully' }));
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

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

// GET /categories
router.get('/categories', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, color, is_active, created_at
       FROM gemba.categories
       ORDER BY name ASC`,
    );
    res.json(success(result.rows));
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

// POST /categories (admin)
router.post('/categories', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { name, description, color, is_active = true } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Category name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.categories (id, name, description, color, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, name, description || null, color || null, is_active],
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

// DELETE /categories/:id (admin)
router.delete('/categories/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba.categories WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Category not found');
    }

    res.json(success({ message: 'Category deleted successfully' }));
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

// ─── AREAS ───────────────────────────────────────────────────────────────────

// GET /areas
router.get('/areas', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, plant_id, is_active, created_at
       FROM gemba.areas
       ORDER BY name ASC`,
    );
    res.json(success(result.rows));
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

// POST /areas (admin)
router.post('/areas', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { name, description, plant_id, is_active = true } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Area name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.areas (id, name, description, plant_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, name, description || null, plant_id || null, is_active],
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

// DELETE /areas/:id (admin)
router.delete('/areas/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba.areas WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Area not found');
    }

    res.json(success({ message: 'Area deleted successfully' }));
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

// ─── TEAMS ───────────────────────────────────────────────────────────────────

// GET /teams
router.get('/teams', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, plant_id, is_active, created_at
       FROM gemba.teams
       ORDER BY name ASC`,
    );
    res.json(success(result.rows));
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

// POST /teams (admin)
router.post('/teams', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { name, description, plant_id, is_active = true } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Team name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.teams (id, name, description, plant_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, name, description || null, plant_id || null, is_active],
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

// DELETE /teams/:id (admin)
router.delete('/teams/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba.teams WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Team not found');
    }

    res.json(success({ message: 'Team deleted successfully' }));
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

// ─── OPERATORS ───────────────────────────────────────────────────────────────

// GET /operators
router.get('/operators', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, employee_code, team_id, workstation_id, is_active, created_at
       FROM gemba.operators
       ORDER BY name ASC`,
    );
    res.json(success(result.rows));
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

// POST /operators (admin)
router.post('/operators', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { name, employee_code, team_id, workstation_id, is_active = true } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Operator name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba.operators (id, name, employee_code, team_id, workstation_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, name, employee_code || null, team_id || null, workstation_id || null, is_active],
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

// DELETE /operators/:id (admin)
router.delete('/operators/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba.operators WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Operator not found');
    }

    res.json(success({ message: 'Operator deleted successfully' }));
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

// ─── SHIFTS ──────────────────────────────────────────────────────────────────

// GET /shifts
router.get('/shifts', requireRole(1), async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, start_time, end_time, is_active, created_at
       FROM gemba.shifts
       ORDER BY start_time ASC`,
    );
    res.json(success(result.rows));
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
