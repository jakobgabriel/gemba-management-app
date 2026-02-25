import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../db.js';
import { requireRole } from '../../middleware/auth.js';
import { success } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/users - List users (admin only)
router.get('/', requireRole(99), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name, u.preferred_lang, u.is_active,
              u.created_at, r.name as role, r.level as role_level, t.name as team_name
       FROM gemba_config.users u
       JOIN gemba_config.roles r ON u.role_id = r.id
       LEFT JOIN gemba_config.teams t ON u.team_id = t.id
       WHERE u.plant_id = $1
       ORDER BY u.display_name`,
      [req.user!.plantId]
    );
    res.json(success(result.rows));
  } catch (err) { next(err); }
});

// GET /api/v1/users/:id - Get a single user (admin only)
router.get('/:id', requireRole(99), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name AS full_name, u.preferred_lang,
              u.is_active, u.role_id, u.team_id, u.plant_id, u.created_at, u.updated_at,
              r.name AS role_name, r.level AS role_level, t.name AS team_name
       FROM gemba_config.users u
       JOIN gemba_config.roles r ON u.role_id = r.id
       LEFT JOIN gemba_config.teams t ON u.team_id = t.id
       WHERE u.id = $1 AND u.plant_id = $2`,
      [id, req.user!.plantId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    res.json(success(result.rows[0]));
  } catch (err) { next(err); }
});

// POST /api/v1/users - Create a user (admin only)
router.post('/', requireRole(99), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, email, full_name, role_id, team_id, plant_id, is_active } = req.body;

    if (!username || !password || !email || !full_name || !role_id || !plant_id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Fields username, password, email, full_name, role_id, and plant_id are required');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO gemba_config.users (username, email, password_hash, display_name, role_id, team_id, plant_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, display_name AS full_name, role_id, team_id, plant_id, is_active, created_at, updated_at`,
      [username, email, password_hash, full_name, role_id, team_id || null, plant_id, is_active !== undefined ? is_active : true]
    );

    res.status(201).json(success(result.rows[0]));
  } catch (err) { next(err); }
});

// PUT /api/v1/users/:id - Update a user (admin only)
router.put('/:id', requireRole(99), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, full_name, role_id, team_id, plant_id, is_active, password } = req.body;

    // Verify the user exists and belongs to the same plant
    const existing = await query(
      `SELECT id FROM gemba_config.users WHERE id = $1 AND plant_id = $2`,
      [id, req.user!.plantId]
    );

    if (existing.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (full_name !== undefined) {
      fields.push(`display_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (role_id !== undefined) {
      fields.push(`role_id = $${paramIndex++}`);
      values.push(role_id);
    }
    if (team_id !== undefined) {
      fields.push(`team_id = $${paramIndex++}`);
      values.push(team_id);
    }
    if (plant_id !== undefined) {
      fields.push(`plant_id = $${paramIndex++}`);
      values.push(plant_id);
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(password_hash);
    }

    if (fields.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE gemba_config.users
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, email, display_name AS full_name, role_id, team_id, plant_id, is_active, created_at, updated_at`,
      values
    );

    res.json(success(result.rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/:id - Delete a user (admin only)
router.delete('/:id', requireRole(99), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM gemba_config.users WHERE id = $1 AND plant_id = $2 RETURNING id`,
      [id, req.user!.plantId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    res.json(success({ message: 'User deleted successfully' }));
  } catch (err) { next(err); }
});

export default router;
