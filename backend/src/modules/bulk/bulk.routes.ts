import { Router, Request, Response } from 'express';
import { query, getClient } from '../../db.js';
import { requireRole } from '../../middleware/auth.js';
import { success } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// =============================================================================
// BULK OPERATIONS (admin level 99)
// =============================================================================

// POST /issues/bulk-create - Create multiple issues in a transaction
router.post('/issues/bulk-create', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'items array is required and must not be empty');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const created: unknown[] = [];
      for (const item of items) {
        const {
          title,
          description,
          category_id,
          area_id,
          priority = 'MEDIUM',
          level = 1,
          source = 'manual',
        } = item;

        if (!title) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Each item must have a title');
        }

        const id = uuidv4();
        const result = await client.query(
          `INSERT INTO gemba.issues (id, title, description, category_id, area_id, priority, level, source, status, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', $9, NOW(), NOW())
           RETURNING *`,
          [id, title, description || null, category_id || null, area_id || null, priority, level, source, req.user!.id],
        );
        created.push(result.rows[0]);
      }

      await client.query('COMMIT');
      res.status(201).json(success({ created: created.length, items: created }));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

// POST /issues/bulk-update - Update multiple issues in a transaction
router.post('/issues/bulk-update', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'items array is required and must not be empty');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let updated = 0;
      for (const item of items) {
        const { id, ...fields } = item;

        if (!id) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Each item must have an id');
        }

        const updates: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (fields.title !== undefined) {
          updates.push(`title = $${paramIndex++}`);
          params.push(fields.title);
        }
        if (fields.description !== undefined) {
          updates.push(`description = $${paramIndex++}`);
          params.push(fields.description);
        }
        if (fields.category_id !== undefined) {
          updates.push(`category_id = $${paramIndex++}`);
          params.push(fields.category_id);
        }
        if (fields.area_id !== undefined) {
          updates.push(`area_id = $${paramIndex++}`);
          params.push(fields.area_id);
        }
        if (fields.priority !== undefined) {
          updates.push(`priority = $${paramIndex++}`);
          params.push(fields.priority);
        }
        if (fields.status !== undefined) {
          updates.push(`status = $${paramIndex++}`);
          params.push(fields.status);
        }
        if (fields.level !== undefined) {
          updates.push(`level = $${paramIndex++}`);
          params.push(fields.level);
        }

        if (updates.length === 0) {
          continue;
        }

        updates.push('updated_at = NOW()');
        params.push(id);

        const result = await client.query(
          `UPDATE gemba.issues SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
          params,
        );

        if (result.rows.length > 0) {
          updated++;
        }
      }

      await client.query('COMMIT');
      res.json(success({ updated }));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

// POST /issues/bulk-delete - Delete multiple issues (with cascade) in a transaction
router.post('/issues/bulk-delete', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'ids array is required and must not be empty');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let deleted = 0;
      for (const id of ids) {
        // Delete related records first (cascade)
        await client.query('DELETE FROM gemba.issue_escalations WHERE issue_id = $1', [id]);
        await client.query('DELETE FROM gemba.issue_resolutions WHERE issue_id = $1', [id]);
        await client.query('DELETE FROM gemba.ai_suggestions WHERE issue_id = $1', [id]);

        const result = await client.query(
          'DELETE FROM gemba.issues WHERE id = $1 RETURNING id',
          [id],
        );

        if (result.rows.length > 0) {
          deleted++;
        }
      }

      await client.query('COMMIT');
      res.json(success({ deleted }));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

// POST /production/bulk-create - Create multiple production entries in a transaction
router.post('/production/bulk-create', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'items array is required and must not be empty');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let created = 0;
      for (const item of items) {
        const {
          workstation_id,
          entry_date,
          hour,
          target,
          actual,
          notes,
        } = item;

        if (!workstation_id || !entry_date || hour === undefined || target === undefined || actual === undefined) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Each item must have workstation_id, entry_date, hour, target, and actual');
        }

        const id = uuidv4();
        await client.query(
          `INSERT INTO gemba.production_entries
            (id, workstation_id, entry_date, hour, target, actual, notes, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (workstation_id, entry_date, hour)
           DO UPDATE SET
             target = EXCLUDED.target,
             actual = EXCLUDED.actual,
             notes = EXCLUDED.notes`,
          [id, workstation_id, entry_date, hour, target, actual, notes || null, req.user!.id],
        );
        created++;
      }

      await client.query('COMMIT');
      res.status(201).json(success({ created }));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

// POST /safety/bulk-create - Create multiple safety entries in a transaction
router.post('/safety/bulk-create', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'items array is required and must not be empty');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let created = 0;
      for (const item of items) {
        const {
          plant_id,
          entry_date,
          shift_id,
          team_id,
          area_id,
          status = 'SAFE',
          notes,
        } = item;

        if (!plant_id || !entry_date || !shift_id || !team_id) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Each item must have plant_id, entry_date, shift_id, and team_id');
        }

        const id = uuidv4();
        await client.query(
          `INSERT INTO gemba.safety_entries
            (id, plant_id, entry_date, shift_id, status, team_id, area_id, notes, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (plant_id, entry_date, shift_id, team_id)
           DO UPDATE SET
             status = EXCLUDED.status,
             area_id = EXCLUDED.area_id,
             notes = EXCLUDED.notes`,
          [id, plant_id, entry_date, shift_id, status, team_id, area_id || null, notes || null, req.user!.id],
        );
        created++;
      }

      await client.query('COMMIT');
      res.status(201).json(success({ created }));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

// POST /config/bulk-import - Bulk import config entities in a transaction
router.post('/config/bulk-import', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { entity, items } = req.body;

    const allowedEntities = ['workstations', 'categories', 'areas', 'teams', 'operators'];
    if (!entity || !allowedEntities.includes(entity)) {
      throw new AppError(400, 'VALIDATION_ERROR', `entity must be one of: ${allowedEntities.join(', ')}`);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'items array is required and must not be empty');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let imported = 0;

      for (const item of items) {
        const id = uuidv4();

        switch (entity) {
          case 'workstations': {
            const { name, code, area_id, is_active = true } = item;
            if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'Each workstation must have a name');
            await client.query(
              `INSERT INTO gemba_config.workstations (id, name, code, area_id, is_active, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
              [id, name, code || null, area_id || null, is_active],
            );
            break;
          }
          case 'categories': {
            const { name, description, color, is_active = true } = item;
            if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'Each category must have a name');
            await client.query(
              `INSERT INTO gemba_config.issue_categories (id, name, description, color, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [id, name, description || null, color || null, is_active],
            );
            break;
          }
          case 'areas': {
            const { name, description, plant_id, is_active = true } = item;
            if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'Each area must have a name');
            await client.query(
              `INSERT INTO gemba_config.areas (id, name, description, plant_id, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [id, name, description || null, plant_id || null, is_active],
            );
            break;
          }
          case 'teams': {
            const { name, description, plant_id, is_active = true } = item;
            if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'Each team must have a name');
            await client.query(
              `INSERT INTO gemba_config.teams (id, name, description, plant_id, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [id, name, description || null, plant_id || null, is_active],
            );
            break;
          }
          case 'operators': {
            const { name, employee_code, team_id, workstation_id, is_active = true } = item;
            if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'Each operator must have a name');
            await client.query(
              `INSERT INTO gemba_config.operators (id, name, employee_code, team_id, workstation_id, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
              [id, name, employee_code || null, team_id || null, workstation_id || null, is_active],
            );
            break;
          }
        }
        imported++;
      }

      await client.query('COMMIT');
      res.status(201).json(success({ entity, imported }));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

// =============================================================================
// EXPORT ENDPOINTS
// =============================================================================

// GET /export/issues - Export all matching issues as JSON (level 2+)
router.get('/export/issues', requireRole(2), async (req: Request, res: Response) => {
  try {
    const {
      status,
      level,
      category_id,
      priority,
      area_id,
      search,
      from_date,
      to_date,
    } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`i.status = $${paramIndex++}`);
      params.push(status);
    }
    if (level) {
      conditions.push(`i.level = $${paramIndex++}`);
      params.push(parseInt(level as string, 10));
    }
    if (category_id) {
      conditions.push(`i.category_id = $${paramIndex++}`);
      params.push(category_id);
    }
    if (priority) {
      conditions.push(`i.priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (area_id) {
      conditions.push(`i.area_id = $${paramIndex++}`);
      params.push(area_id);
    }
    if (search) {
      conditions.push(`(i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (from_date) {
      conditions.push(`i.created_at >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`i.created_at <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataResult = await query(
      `SELECT i.id, i.title, i.description, i.status, i.level, i.priority,
              i.category_id, c.name AS category_name,
              i.area_id, a.name AS area_name,
              i.source, i.created_by, i.created_at, i.updated_at
       FROM gemba.issues i
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       LEFT JOIN gemba_config.areas a ON i.area_id = a.id
       ${whereClause}
       ORDER BY i.created_at DESC`,
      params,
    );

    res.setHeader('Content-Disposition', 'attachment; filename="issues-export.json"');
    res.json(dataResult.rows);
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

// GET /export/production - Export all matching production entries as JSON (level 2+)
router.get('/export/production', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, workstation_id, shift_id } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`pe.entry_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`pe.entry_date <= $${paramIndex++}`);
      params.push(to_date);
    }
    if (workstation_id) {
      conditions.push(`pe.workstation_id = $${paramIndex++}`);
      params.push(workstation_id);
    }
    if (shift_id) {
      conditions.push(`pe.shift_id = $${paramIndex++}`);
      params.push(shift_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataResult = await query(
      `SELECT pe.id, pe.workstation_id, w.name AS workstation_name,
              pe.shift_id, s.name AS shift_name,
              pe.entry_date, pe.hour, pe.target, pe.actual,
              pe.notes,
              pe.created_by, pe.created_at
       FROM gemba.production_entries pe
       LEFT JOIN gemba_config.workstations w ON pe.workstation_id = w.id
       LEFT JOIN gemba_config.shift_definitions s ON pe.shift_id = s.id
       ${whereClause}
       ORDER BY pe.entry_date DESC, pe.hour ASC`,
      params,
    );

    res.setHeader('Content-Disposition', 'attachment; filename="production-export.json"');
    res.json(dataResult.rows);
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

// GET /export/safety - Export all matching safety entries as JSON (level 2+)
router.get('/export/safety', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, team_id, area_id } = req.query;

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataResult = await query(
      `SELECT se.id, se.plant_id, se.entry_date, se.shift_id,
              se.team_id, t.name AS team_name,
              se.area_id, a.name AS area_name,
              se.status, se.notes,
              se.created_by, se.created_at
       FROM gemba.safety_entries se
       LEFT JOIN gemba_config.teams t ON se.team_id = t.id
       LEFT JOIN gemba_config.areas a ON se.area_id = a.id
       ${whereClause}
       ORDER BY se.entry_date DESC, se.created_at DESC`,
      params,
    );

    res.setHeader('Content-Disposition', 'attachment; filename="safety-export.json"');
    res.json(dataResult.rows);
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

// GET /export/config - Export config entity data as JSON (level 99)
router.get('/export/config', requireRole(99), async (req: Request, res: Response) => {
  try {
    const { entity } = req.query;

    const allowedEntities: Record<string, string> = {
      workstations: `SELECT id, name, code, area_id, is_active, created_at, updated_at FROM gemba_config.workstations ORDER BY name ASC`,
      categories: `SELECT id, name, description, color, is_active, created_at FROM gemba_config.issue_categories ORDER BY name ASC`,
      areas: `SELECT id, name, description, plant_id, is_active, created_at FROM gemba_config.areas ORDER BY name ASC`,
      teams: `SELECT id, name, description, plant_id, is_active, created_at FROM gemba_config.teams ORDER BY name ASC`,
      operators: `SELECT id, name, employee_code, team_id, workstation_id, is_active, created_at FROM gemba_config.operators ORDER BY name ASC`,
      shifts: `SELECT id, name, start_time, end_time, is_active, created_at FROM gemba_config.shift_definitions ORDER BY start_time ASC`,
    };

    if (!entity || !allowedEntities[entity as string]) {
      throw new AppError(400, 'VALIDATION_ERROR', `entity must be one of: ${Object.keys(allowedEntities).join(', ')}`);
    }

    const dataResult = await query(allowedEntities[entity as string]);

    res.setHeader('Content-Disposition', `attachment; filename="${entity}-export.json"`);
    res.json(dataResult.rows);
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

// GET /export/gemba-walks - Export gemba walks with findings as JSON (level 2+)
router.get('/export/gemba-walks', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, status } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`gw.started_at >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`gw.started_at <= $${paramIndex++}`);
      params.push(to_date);
    }
    if (status) {
      conditions.push(`gw.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const walksResult = await query(
      `SELECT gw.id, gw.focus, gw.status, gw.target_areas, gw.participants,
              gw.current_step, gw.team_feedback, gw.duration_min,
              gw.leader_id, u.username AS leader_username, u.display_name AS leader_name,
              gw.started_at, gw.completed_at
       FROM gemba.gemba_walks gw
       LEFT JOIN gemba_config.users u ON gw.leader_id = u.id
       ${whereClause}
       ORDER BY gw.started_at DESC`,
      params,
    );

    // Attach findings to each walk
    const walks = [];
    for (const walk of walksResult.rows) {
      const findingsResult = await query(
        `SELECT gf.id, gf.observation, gf.finding_type, gf.area_id,
                a.name AS area_name, gf.created_at
         FROM gemba.gemba_walk_findings gf
         LEFT JOIN gemba_config.areas a ON gf.area_id = a.id
         WHERE gf.walk_id = $1
         ORDER BY gf.created_at ASC`,
        [walk.id],
      );
      walks.push({ ...walk, findings: findingsResult.rows });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="gemba-walks-export.json"');
    res.json(walks);
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
