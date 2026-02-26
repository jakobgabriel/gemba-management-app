import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { query } from '../../db.js';
import { config } from '../../config.js';
import { authenticate } from '../../middleware/auth.js';
import { success } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Username and password are required');
    }

    const result = await query(
      `SELECT u.id, u.username, u.password_hash, u.plant_id,
              r.id AS role_id, r.name AS role_name, r.level AS role_level
       FROM gemba_config.users u
       JOIN gemba_config.roles r ON u.role_id = r.id
       WHERE u.username = $1 AND u.is_active = true`,
      [username],
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role_name,
      roleLevel: user.role_level,
      plantId: user.plant_id,
    };

    const accessToken = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as StringValue,
    });

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwtSecret,
      { expiresIn: config.jwtRefreshExpiresIn as StringValue },
    );

    res.json(success({
      token: accessToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      user: {
        id: user.id,
        username: user.username,
        role: user.role_name,
        role_level: user.role_level,
        plant_id: user.plant_id,
      },
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null,
        meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Refresh token is required');
    }

    let decoded: { id: string; type: string };
    try {
      decoded = jwt.verify(refresh_token, config.jwtSecret) as { id: string; type: string };
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'INVALID_TOKEN', 'Token is not a refresh token');
    }

    const result = await query(
      `SELECT u.id, u.username, u.plant_id,
              r.name AS role_name, r.level AS role_level
       FROM gemba_config.users u
       JOIN gemba_config.roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.is_active = true`,
      [decoded.id],
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'INVALID_TOKEN', 'User not found or inactive');
    }

    const user = result.rows[0];

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role_name,
      roleLevel: user.role_level,
      plantId: user.plant_id,
    };

    const accessToken = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as StringValue,
    });

    const newRefreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwtSecret,
      { expiresIn: config.jwtRefreshExpiresIn as StringValue },
    );

    res.json(success({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null,
        meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// POST /logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json(success({ message: 'Logged out successfully' }));
});

// GET /me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name, u.plant_id,
              r.id AS role_id, r.name AS role_name, r.level AS role_level,
              t.id AS team_id, t.name AS team_name,
              p.id AS plant_id, p.name AS plant_name
       FROM gemba_config.users u
       JOIN gemba_config.roles r ON u.role_id = r.id
       LEFT JOIN gemba_config.teams t ON u.team_id = t.id
       LEFT JOIN gemba_config.plants p ON u.plant_id = p.id
       WHERE u.id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    const user = result.rows[0];

    res.json(success({
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      role: user.role_name,
      role_level: user.role_level,
      plant_id: user.plant_id,
      team_id: user.team_id || null,
      preferred_lang: 'en',
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null,
        meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

export default router;
