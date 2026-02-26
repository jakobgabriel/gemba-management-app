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
      `SELECT id, machine_code, name, area_id, team_id, default_part, is_active, created_at, updated_at
       FROM gemba_config.workstations
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
    const { name, machine_code, area_id, team_id, default_part, is_active = true } = req.body;

    if (!name || !machine_code || !area_id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Workstation name, machine_code, and area_id are required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba_config.workstations (id, plant_id, machine_code, name, area_id, team_id, default_part, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [id, req.user!.plantId, machine_code, name, area_id, team_id || null, default_part || null, is_active],
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
    const { name, machine_code, area_id, team_id, default_part, is_active } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (machine_code !== undefined) {
      updates.push(`machine_code = $${paramIndex++}`);
      params.push(machine_code);
    }
    if (area_id !== undefined) {
      updates.push(`area_id = $${paramIndex++}`);
      params.push(area_id);
    }
    if (team_id !== undefined) {
      updates.push(`team_id = $${paramIndex++}`);
      params.push(team_id);
    }
    if (default_part !== undefined) {
      updates.push(`default_part = $${paramIndex++}`);
      params.push(default_part);
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
      `UPDATE gemba_config.workstations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
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
      `DELETE FROM gemba_config.workstations WHERE id = $1 RETURNING id`,
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
      `SELECT id, name, sort_order, created_at
       FROM gemba_config.issue_categories
       ORDER BY sort_order ASC, name ASC`,
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
    const { name, sort_order } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Category name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba_config.issue_categories (id, plant_id, name, sort_order, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, req.user!.plantId, name, sort_order || 0],
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

// PUT /categories/:id (admin)
router.put('/categories/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      params.push(sort_order);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    params.push(id);

    const result = await query(
      `UPDATE gemba_config.issue_categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Category not found');
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

// DELETE /categories/:id (admin)
router.delete('/categories/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba_config.issue_categories WHERE id = $1 RETURNING id`,
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
      `SELECT id, name, code, plant_id, created_at, updated_at
       FROM gemba_config.areas
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
    const { name, code } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Area name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba_config.areas (id, plant_id, name, code, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [id, req.user!.plantId, name, code || null],
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

// PUT /areas/:id (admin)
router.put('/areas/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

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

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE gemba_config.areas SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Area not found');
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

// DELETE /areas/:id (admin)
router.delete('/areas/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba_config.areas WHERE id = $1 RETURNING id`,
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
      `SELECT id, name, plant_id, created_at, updated_at
       FROM gemba_config.teams
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
    const { name } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Team name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba_config.teams (id, plant_id, name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [id, req.user!.plantId, name],
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

// PUT /teams/:id (admin)
router.put('/teams/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE gemba_config.teams SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Team not found');
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

// DELETE /teams/:id (admin)
router.delete('/teams/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba_config.teams WHERE id = $1 RETURNING id`,
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
      `SELECT id, name, team_id, user_id, is_active, created_at
       FROM gemba_config.operators
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
    const { name, team_id, user_id, is_active = true } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Operator name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba_config.operators (id, plant_id, name, team_id, user_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, req.user!.plantId, name, team_id || null, user_id || null, is_active],
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

// PUT /operators/:id (admin)
router.put('/operators/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, team_id, user_id, is_active } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (team_id !== undefined) {
      updates.push(`team_id = $${paramIndex++}`);
      params.push(team_id);
    }
    if (user_id !== undefined) {
      updates.push(`user_id = $${paramIndex++}`);
      params.push(user_id);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    params.push(id);

    const result = await query(
      `UPDATE gemba_config.operators SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Operator not found');
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

// DELETE /operators/:id (admin)
router.delete('/operators/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba_config.operators WHERE id = $1 RETURNING id`,
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
      `SELECT id, name, start_time, end_time, sort_order, created_at
       FROM gemba_config.shift_definitions
       ORDER BY sort_order ASC, start_time ASC`,
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

// POST /shifts (admin)
router.post('/shifts', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { name, start_time, end_time, sort_order } = req.body;

    if (!name) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Shift name is required');
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO gemba_config.shift_definitions (id, plant_id, name, start_time, end_time, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, req.user!.plantId, name, start_time || null, end_time || null, sort_order || 0],
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

// PUT /shifts/:id (admin)
router.put('/shifts/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, start_time, end_time, sort_order } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (start_time !== undefined) {
      updates.push(`start_time = $${paramIndex++}`);
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push(`end_time = $${paramIndex++}`);
      params.push(end_time);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      params.push(sort_order);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    params.push(id);

    const result = await query(
      `UPDATE gemba_config.shift_definitions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Shift not found');
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

// DELETE /shifts/:id (admin)
router.delete('/shifts/:id', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba_config.shift_definitions WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Shift not found');
    }

    res.json(success({ message: 'Shift deleted successfully' }));
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
