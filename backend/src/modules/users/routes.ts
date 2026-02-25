import { Router } from 'express';
import { query } from '../../db.js';
import { requireRole } from '../../middleware/auth.js';
import { success } from '../../utils/response.js';
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

export default router;
